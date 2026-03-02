import { Button, Container, TextField, Typography } from '@mui/material';
import { useState } from 'react';

export function App(): JSX.Element {
  const [status, setStatus] = useState('unknown');
  const [baseUrl, setBaseUrl] = useState('http://localhost:3000/mock-thingworx');
  const [appKey, setAppKey] = useState('12345678');

  return <Container>
    <Typography variant='h4'>ThingWorx Studio Desktop</Typography>
    <Button onClick={async () => { await fetch('http://localhost:3000/auth/callback', { credentials: 'include' }); setStatus('logged-in'); }}>Sign in with SSO</Button>
    <Typography>Auth: {status}</Typography>
    <TextField label='ThingWorx Base URL' value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} fullWidth />
    <TextField label='AppKey' value={appKey} onChange={(e) => setAppKey(e.target.value)} fullWidth />
    <Button onClick={async () => {
      const r = await fetch('http://localhost:3000/thingworx/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ baseUrl, appKey }) });
      const data = await r.json();
      setStatus(data.ok ? 'thingworx-ok' : 'thingworx-fail');
    }}>Verify connection</Button>
  </Container>;
}
