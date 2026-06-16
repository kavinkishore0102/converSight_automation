const TOKEN = 'Bearer JWT eyJhbGciOiJIUzI1NiJ9.eyJfZG9jIjp7InVzZXJJZCI6ImIzNDJlYjJmLTM5ZmYtNDY2NS1iOWMwLTg1ZDdiYjM2NDk0OSIsImF0aGVuYUlkIjoiYjM0MmViMmYtMzlmZi00NjY1LWI5YzAtODVkN2JiMzY0OTQ5Iiwib3JnSWQiOiI5YjUwNTYwOS04MzJjLTQ1M2ItOWUwNy0xOTg5N2M1OTI3M2UiLCJkZXZpY2VJZCI6IjEyMzQ1NiIsImRldmljZU5hbWUiOiJCcm93c2VyV2ViIiwiaXNUcmlhbFVzZXIiOmZhbHNlLCJpc0ZpcnN0VGltZUxvZ2luIjpmYWxzZSwic2Vzc2lvbklkIjoiY3MtMTVjYzRhZWMtNzk5OC00NjA0LWI4MjctODM2ZWM2ODk4OWEwIn0sImlhdCI6MTc4MTAxMTg0NH0.wXILIUVFmTUOi1jWMhx3rmW_8Gv-J77Ej5zCTuMz1ys';
const BASE = 'https://api.conversight.ai/universe-engine/v2/api';
const CRN = 'crn:dev:us:step_flow:9b505609-832c-453b-9e07-19897c59273e:standard:irtautomation';
const BODY = JSON.stringify({ config: { source: 'portal', category: 'Activate Dataset', details: '{}', slackID: '' } });

async function hit(method, path, body) {
    const r = await fetch(BASE + path, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: TOKEN },
        body: method === 'GET' ? undefined : (body || BODY),
    });
    const text = await r.text();
    console.log(`${r.status}  ${method} ${path}`);
    console.log(`     ${text.slice(0, 500)}`);
    console.log('');
}

(async () => {
    // 1. Is the token still valid? (GET that worked in your original curl)
    await hit('GET', `/resource/${CRN}`);

    // 2. Re-test the 401 path with full response visible
    await hit('POST', `/resource/${CRN}`);

    // 3. Try more execute patterns
    for (const p of [
        `/step_flow_execution/${CRN}`,
        `/step_flow_executions`,
        `/workflow/${CRN}/start`,
        `/workflow_execution`,
        `/trigger/${CRN}`,
        `/triggers/${CRN}`,
        `/start_execution/${CRN}`,
        `/start_execution`,
        `/standard_step_flow/${CRN}/execute`,
        `/task/irt:IrtAutomationFlow:3.9:P/execute`,
    ]) {
        await hit('POST', p);
    }
})();