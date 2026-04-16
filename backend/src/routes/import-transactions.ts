import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/client'
import { transactions, accounts } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth'
import csvParser from 'csv-parser'
import Papa from 'papaparse'
import { parseString } from 'ofx-js'
import { nanoid } from 'nanoid'
import { createReadStream } from 'fs'
import { Readable } from 'stream'

const router = new Hono()
router.use(requireAuth)

// Schema para a importação de arquivo
const importSchema = z.object({
  accountId: z.string().min(1),
  fileType: z.enum(['csv', 'ofx']),
})

// Função auxiliar para converter OFX para transações
const convertOfxToTransactions = (ofxData: any, userId: string, accountId: string) => {
  const transactions = []

  if (ofxData?.OFX?.BANKMSGSRSV1?.STMTTRNRS?.STMTRS?.STMTTRN) {
    const ofxTransactions = Array.isArray(ofxData.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.STMTTRN)
      ? ofxData.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.STMTTRN
      : [ofxData.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.STMTTRN]

    for (const tx of ofxTransactions) {
      transactions.push({
        id: nanoid(),
        userId,
        accountId,
        title: tx.NAME || tx.TRNTYPE || 'Transação Importada',
        amount: Math.abs(parseFloat(tx.TRNAMT)),
        type: parseFloat(tx.TRNAMT) >= 0 ? 'income' : 'expense',
        category: 'other',
        context: 'individual', // Será determinado com base na conta
        notes: tx.MEMO || '',
        date: new Date(tx.DTPOSTED || tx.DTUSER),
        createdAt: new Date(),
      })
    }
  }

  return transactions
}

// Função auxiliar para converter CSV para transações
const convertCsvToTransactions = (csvData: any[], userId: string, accountId: string) => {
  const transactions = []

  // Assumindo que o CSV tem colunas padrão como: date, description, amount
  for (const row of csvData) {
    // Mapear diferentes possíveis nomes de colunas
    const date = row.date || row.Date || row['Data'] || row['DATA']
    const description = row.description || row.Description || row['Descrição'] || row['DESCRICAO'] || row.desc || row.Desc
    const amount = row.amount || row.Amount || row['Valor'] || row['VALOR'] || row.value || row.Value

    if (date && description && amount !== undefined && amount !== null) {
      // Converter o valor para número
      const amountNum = typeof amount === 'string'
        ? parseFloat(amount.replace(/[^\d.-]/g, ''))
        : Number(amount)

      if (!isNaN(amountNum)) {
        transactions.push({
          id: nanoid(),
          userId,
          accountId,
          title: description.toString(),
          amount: Math.abs(amountNum),
          type: amountNum >= 0 ? 'income' : 'expense',
          category: 'other',
          context: 'individual', // Será determinado com base na conta
          notes: `Importado de CSV em ${new Date().toISOString()}`,
          date: new Date(date),
          createdAt: new Date(),
        })
      }
    }
  }

  return transactions
}

router.post('/import', async (c) => {
  const user = c.get('user')
  const formData = await c.req.formData()

  const accountId = formData.get('accountId') as string
  const file = formData.get('file') as File

  if (!file) {
    return c.json({ error: 'No file provided' }, 400)
  }

  if (!accountId) {
    return c.json({ error: 'No account ID provided' }, 400)
  }

  // Verificar se a conta pertence ao usuário
  const account = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, user.id)))
    .limit(1)

  if (!account.length) {
    return c.json({ error: 'Account not found or does not belong to user' }, 404)
  }

  // Determinar o tipo de arquivo com base na extensão
  const fileType = file.name.toLowerCase().endsWith('.ofx') ? 'ofx' : 'csv'

  try {
    let importedTransactions = []

    if (fileType === 'ofx') {
      // Processar arquivo OFX
      const fileBuffer = await file.arrayBuffer()
      const fileText = new TextDecoder().decode(fileBuffer)

      const ofxData = await parseString(fileText)
      importedTransactions = convertOfxToTransactions(ofxData, user.id, accountId)
    } else {
      // Processar arquivo CSV
      const fileBuffer = await file.text()
      const csvData = Papa.parse(fileBuffer, { header: true }).data
      importedTransactions = convertCsvToTransactions(csvData, user.id, accountId)
    }

    if (importedTransactions.length > 0) {
      // Inserir as transações no banco de dados
      await db.insert(transactions).values(importedTransactions)
    }

    return c.json({
      message: `Successfully imported ${importedTransactions.length} transactions`,
      importedCount: importedTransactions.length,
      transactions: importedTransactions.slice(0, 5) // Retorna as primeiras 5 transações como exemplo
    })
  } catch (error) {
    console.error('Import error:', error)
    return c.json({ error: `Failed to import file: ${error.message}` }, 500)
  }
})

// Endpoint para upload de arquivo e pré-visualização
router.post('/preview', async (c) => {
  const user = c.get('user')
  const formData = await c.req.formData()

  const accountId = formData.get('accountId') as string
  const file = formData.get('file') as File

  if (!file) {
    return c.json({ error: 'No file provided' }, 400)
  }

  if (!accountId) {
    return c.json({ error: 'No account ID provided' }, 400)
  }

  // Verificar se a conta pertence ao usuário
  const account = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, user.id)))
    .limit(1)

  if (!account.length) {
    return c.json({ error: 'Account not found or does not belong to user' }, 404)
  }

  try {
    let previewData = []

    if (file.name.toLowerCase().endsWith('.ofx')) {
      // Pré-visualização para OFX
      const fileBuffer = await file.arrayBuffer()
      const fileText = new TextDecoder().decode(fileBuffer)
      const ofxData = await parseString(fileText)

      const sampleTransactions = convertOfxToTransactions(ofxData, user.id, accountId)
      previewData = sampleTransactions.slice(0, 5) // Pegar até 5 transações para prévia
    } else {
      // Pré-visualização para CSV
      const fileBuffer = await file.text()
      const csvData = Papa.parse(fileBuffer, { header: true }).data
      const sampleTransactions = convertCsvToTransactions(csvData, user.id, accountId)
      previewData = sampleTransactions.slice(0, 5) // Pegar até 5 transações para prévia
    }

    return c.json({
      message: 'File parsed successfully',
      preview: previewData,
      totalCount: previewData.length
    })
  } catch (error) {
    console.error('Preview error:', error)
    return c.json({ error: `Failed to parse file: ${error.message}` }, 500)
  }
})

export default router