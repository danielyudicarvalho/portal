'use client';

export default function JSTest() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#000', color: '#fff', minHeight: '100vh' }}>
      <h1>JavaScript Test Page</h1>
      
      <button 
        onClick={() => alert('Basic click works!')}
        style={{
          backgroundColor: 'red',
          color: 'white',
          padding: '20px 40px',
          fontSize: '20px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        TEST BUTTON 1 - Click Me!
      </button>
      
      <br />
      
      <button 
        onClick={() => {
          console.log('Button 2 clicked');
          alert('Button 2 clicked!');
        }}
        style={{
          backgroundColor: 'blue',
          color: 'white',
          padding: '20px 40px',
          fontSize: '20px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        TEST BUTTON 2 - Console Log
      </button>
      
      <br />
      
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#333' }}>
        <p>This is a basic test to verify JavaScript execution works.</p>
        <p>If these buttons don't work, there's a fundamental JavaScript issue.</p>
        <p>Check the browser console for any errors.</p>
      </div>
    </div>
  );
}
