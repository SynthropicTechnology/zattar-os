import { NextRequest, NextResponse } from 'next/server';
import { createChatService } from '@/app/(authenticated)/chat/service';
import { getRecordingDetails } from '@/lib/dyte/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar webhook signature (se configurado no Dyte)
    // const signature = request.headers.get('x-dyte-signature');
    // if (!validateSignature(signature, body)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const { event, data } = body;

    // Processar evento de gravação
    if (event === 'recording.statusUpdate' && data.status === 'UPLOADED') {
      const recordingId = data.id;
      const meetingId = data.meeting_id;

      // Buscar detalhes da gravação
      const details = await getRecordingDetails(recordingId);
      if (!details || !details.download_url) {
        return NextResponse.json({ error: 'Recording not ready' }, { status: 400 });
      }

      // Buscar chamada pelo meetingId
      const { createCallsRepository } = await import('@/app/(authenticated)/chat/repository');
      const callsRepo = await createCallsRepository();
      const chamadaResult = await callsRepo.findChamadaByMeetingId(meetingId);
      
      if (chamadaResult.isErr() || !chamadaResult.value) {
        return NextResponse.json({ error: 'Call not found' }, { status: 404 });
      }

      // Salvar URL de gravação via service (para manter consistência)
      const service = await createChatService();
      await service.salvarUrlGravacao(chamadaResult.value.id, details.download_url);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true, message: 'Event ignored' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
