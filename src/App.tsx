import { useState } from 'react'
     import './App.css'
    
     function App() {
       const [apiKey, setApiKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');
       const [count, setCount] = useState(0);
    
       if (!apiKey) {
         return (
          <div style={{
           display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#1a1a1a',
           color: 'white',
            fontFamily: 'sans-serif'
          }}>
           <h2>Mingma's Phone Tracker</h2>
           <p>Enter Gemini API Key to continue</p>
           <input
              type="password"
             placeholder="Paste API Key here..."
             style={{ padding: '10px', width: '300px', borderRadius: '5px', border: 'none', color: 'black' }}
             onKeyDown={(e) => {
                if (e.key === 'Enter') {
                 const value = (e.target as HTMLInputElement).value;
                 localStorage.setItem('GEMINI_API_KEY', value);
                 setApiKey(value);
                }
              }}
            />
            <p style={{ fontSize: '12px', color: '#888' }}>Press Enter to save. Stored locally in your browser.</p>
          </div>
       );
     }
   
     return (
        <div style={{ padding: '20px', color: 'white', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
<h1>Tracker Active</h1>
        <p>API Key is set. You can now use the OCR features.</p>
          <button
           type="button"
             onClick={() => setCount((count) => count + 1)}
         style={{ padding: '10px 20px', cursor: 'pointer' }}
           >
          Count is {count}
        </button>
         <br />
         <button
           onClick={() => {
            localStorage.removeItem('GEMINI_API_KEY');
             setApiKey('');
          }}
          style={{ marginTop: '20px', backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor:
      'pointer' }}
 >
 Logout (Remove Key)
 </button>
</div>
)
}

export default App