/**
 * DYTE CLIENT
 *
 * Server-side client to interact with Dyte API.
 * Lê credenciais exclusivamente da tabela `integracoes` via getDyteConfig().
 */

import { getDyteConfig, isDyteTranscriptionEnabled, getDyteTranscriptionLanguage } from './config';

const DYTE_API_BASE = 'https://api.dyte.io/v2';

// Helper for Basic Auth header (async — reads config from DB)
async function getAuthHeader() {
  const config = await getDyteConfig();
  const token = Buffer.from(`${config.org_id}:${config.api_key}`).toString('base64');
  return `Basic ${token}`;
}

/**
 * Updates an existing preset to enable transcription.
 * Preserves the original preset role and permissions.
 */
export async function ensureTranscriptionPreset(presetName: string = 'group_call_with_transcription') {
  const config = await getDyteConfig();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': await getAuthHeader(),
  };

  const transcriptionConfig = {
    transcription_enabled: true,
    transcription_config: {
      language: getDyteTranscriptionLanguage(config),
    },
  };

  // Check if preset exists
  const checkResponse = await fetch(`${DYTE_API_BASE}/presets/${presetName}`, {
    method: 'GET',
    headers,
  });

  if (!checkResponse.ok) {
    console.warn(`Dyte preset '${presetName}' was not found; skipping transcription enablement for this preset.`);
    return presetName;
  }

  const updateResponse = await fetch(`${DYTE_API_BASE}/presets/${presetName}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(transcriptionConfig),
  });

  if (!updateResponse.ok) {
    console.warn(`Failed to update Dyte preset '${presetName}', transcription might not work as expected.`);
  }

  return presetName;
}

/**
 * Lists available presets and returns the first matching preset name.
 * Falls back to listing all presets if none of the preferred names exist.
 */
export async function getAvailablePresetName(preferred: string[] = ['group_call_host', 'group_call_participant']): Promise<string> {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': await getAuthHeader(),
  };

  // Try each preferred name
  for (const name of preferred) {
    const response = await fetch(`${DYTE_API_BASE}/presets/${name}`, {
      method: 'GET',
      headers,
    });
    if (response.ok) return name;
  }

  // Fallback: list all presets and return the first one
  const listResponse = await fetch(`${DYTE_API_BASE}/presets`, {
    method: 'GET',
    headers,
  });

  if (listResponse.ok) {
    const result = await listResponse.json();
    const presets = result.data;
    if (Array.isArray(presets) && presets.length > 0) {
      return presets[0].name as string;
    }
  }

  // Last resort: return default name (Dyte creates one by default)
  return 'group_call_host';
}

/**
 * Create a new meeting in Dyte.
 */
export async function createMeeting(title: string) {
  const config = await getDyteConfig();
  const body: Record<string, unknown> = {
    title,
    record_on_start: false,
    live_stream_on_start: false,
  };

  if (config.enable_transcription) {
    body.ai_config = {
      transcription: {
        language: getDyteTranscriptionLanguage(config),
      },
    };
  }

  const response = await fetch(`${DYTE_API_BASE}/meetings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': await getAuthHeader(),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create Dyte meeting: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.data.id as string;
}

/**
 * Add a participant to a meeting and get their auth token.
 */
export async function addParticipant(meetingId: string, name: string, preset_name: string = 'group_call_participant') {
  const participantData = {
    name,
    preset_name,
    client_specific_id: `${name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
  };

  if (await isDyteTranscriptionEnabled()) {
    await ensureTranscriptionPreset(preset_name);
  }

  const response = await fetch(`${DYTE_API_BASE}/meetings/${meetingId}/participants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': await getAuthHeader(),
    },
    body: JSON.stringify(participantData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to add participant to Dyte meeting with preset '${preset_name}': ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.data.token as string;
}

/**
 * Get details of a specific meeting.
 */
export async function getMeetingDetails(meetingId: string) {
  const response = await fetch(`${DYTE_API_BASE}/meetings/${meetingId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': await getAuthHeader(),
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    const errorText = await response.text();
    throw new Error(`Failed to get Dyte meeting details: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * List active meetings.
 */
export async function getActiveMeetings() {
  const response = await fetch(`${DYTE_API_BASE}/meetings?status=LIVE`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': await getAuthHeader(),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list active Dyte meetings: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Inicia gravação de um meeting
 * @returns Recording ID para controle posterior
 */
export async function startRecording(meetingId: string): Promise<string> {
  const response = await fetch(`${DYTE_API_BASE}/meetings/${meetingId}/recordings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': await getAuthHeader(),
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to start recording: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.data.id as string;
}

/**
 * Para gravação de um meeting
 */
export async function stopRecording(recordingId: string): Promise<void> {
  const response = await fetch(`${DYTE_API_BASE}/recordings/${recordingId}/stop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': await getAuthHeader(),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to stop recording: ${response.status} ${errorText}`);
  }
}

/**
 * Busca detalhes de uma gravação (incluindo URL de download)
 */
export async function getRecordingDetails(recordingId: string) {
  const response = await fetch(`${DYTE_API_BASE}/recordings/${recordingId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': await getAuthHeader(),
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    const errorText = await response.text();
    throw new Error(`Failed to get recording details: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.data;
}
