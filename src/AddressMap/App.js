import React, { useState } from 'react';
import AddressMap from './AddressMap';

function App() {
  const [address, setAddress] = useState('1600 Amphitheatre Parkway, Mountain View, CA');

  return (
    <div style={{ padding: '20px' }}>
      <h1>Address Map Demo</h1>
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        style={{ width: '300px', padding: '8px', marginBottom: '20px' }}
      />
      <AddressMap address={address} />
    </div>
  );
}

export default App;