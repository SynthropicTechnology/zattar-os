// Script simples para testar upload de PDF para Google Drive via N8N

import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Teste simples do fluxo N8N - Pega PDF de results e envia
 */
async function testarUploadN8N() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 TESTE: Upload de PDF para Google Drive via N8N');
    console.log('='.repeat(80) + '\n');

    // 1. Pegar um PDF da pasta results
    console.log('📁 [1/2] Buscando PDF...\n');
    
    const pdfPath = resolve(
      process.cwd(), 
      'dev_data/scripts/results/timeline-exploratorio/documentos-pdf/pdf-com-assinatura-sem-capa-doc222702194-2025-11-20T14-25-25-015Z.pdf'
    );
    
    console.log(`   Caminho: ${pdfPath}\n`);
    
    const pdfBuffer = readFileSync(pdfPath);
    const tamanhoKB = (pdfBuffer.length / 1024).toFixed(2);
    console.log(`✅ PDF carregado: ${tamanhoKB} KB\n`);

    // 2. Fazer upload via N8N
    console.log('📤 [2/2] Enviando para Google Drive via N8N...\n');

    const webhookUrl = 'https://webhook.synthropic.app/webhook/drive';
    
    // Converter PDF para base64
    const pdfBase64 = pdfBuffer.toString('base64');

    // Preparar payload
    const timestamp = Date.now();
    const fileName = `teste_n8n_${timestamp}.pdf`;

    const payload = {
      operation: 'upload',
      domain: 'timeline',
      data: {
        numeroProcesso: 'teste',
        trt: 'TRT3',
        fileName,
        fileContent: pdfBase64,
        contentType: 'application/pdf',
      },
    };

    console.log(`   Webhook: ${webhookUrl}`);
    console.log(`   Arquivo: ${fileName}`);
    console.log(`   Tamanho: ${tamanhoKB} KB`);
    console.log(`   Base64: ${pdfBase64.substring(0, 50)}...`);
    console.log(`\n   Enviando requisição...\n`);

    // Fazer requisição para N8N
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`   Status HTTP: ${webhookResponse.status} ${webhookResponse.statusText}\n`);

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      throw new Error(
        `Erro no webhook N8N: ${webhookResponse.status} - ${errorText}`
      );
    }

    // Processar resposta
    const webhookResult = await webhookResponse.json();

    console.log('='.repeat(80));
    console.log('✅ UPLOAD CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(80));
    console.log('\n📊 RESPOSTA DO N8N:\n');
    console.log(JSON.stringify(webhookResult, null, 2));

    console.log('\n📁 INFORMAÇÕES DO ARQUIVO NO GOOGLE DRIVE:\n');
    console.log(`   File ID: ${webhookResult.file_id || webhookResult.fileId || 'N/A'}`);
    console.log(`   File Name: ${webhookResult.file_name || webhookResult.fileName || 'N/A'}`);
    console.log(`   Link Visualização: ${webhookResult.web_view_link || webhookResult.webViewLink || 'N/A'}`);
    console.log(`   Link Download: ${webhookResult.web_content_link || webhookResult.webContentLink || 'N/A'}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ TESTE CONCLUÍDO!');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error);
    if (error instanceof Error) {
      console.error('\nDetalhes:', error.message);
    }
  }
}

// Executar teste
testarUploadN8N();
