import { useState } from 'react'
    2 import './App.css'
    3
    4 function App() {
    5   // 1. Logic to get/set the API key from browser storage
    6   const [apiKey, setApiKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');
    7   const [count, setCount] = useState(0);
    8
    9   // 2. If no key is found, show this simple login screen
   10   if (!apiKey) {
   11     return (
   12       <div style={{
   13         display: 'flex',
   14         flexDirection: 'column',
   15         alignItems: 'center',
   16         justifyContent: 'center',
   17         height: '100vh',
   18         backgroundColor: '#1a1a1a',
   19         color: 'white',
   20         fontFamily: 'sans-serif'
   21       }}>
   22         <h2>Mingma's Phone Tracker</h2>
   23         <p>Enter Gemini API Key to continue</p>
   24         <input
   25           type="password"
   26           placeholder="Paste API Key here..."
   27           style={{ padding: '10px', width: '300px', borderRadius: '5px', border: 'none' }}
   28           onKeyDown={(e) => {
   29             if (e.key === 'Enter') {
   30               const value = (e.target as HTMLInputElement).value;
   31               localStorage.setItem('GEMINI_API_KEY', value);
   32               setApiKey(value);
   33             }
   34           }}
   35         />
   36         <p style={{ fontSize: '12px', color: '#888' }}>Press Enter to save. Stored locally in your browser.</p>
   37       </div>
   38     );
   39   }
   40
   41   // 3. Your actual App UI (only shows if apiKey exists)
   42   return (
   43     <>
   44       <section id="center">
   45         <h1>Tracker Active</h1>
   46         <p>API Key is set. You can now use the OCR features.</p>
   47         <button
   48           type="button"
   49           className="counter"
   50           onClick={() => setCount((count) => count + 1)}
   51         >
   52           Count is {count}
   53         </button>
   54         <br />
   55         <button
   56           onClick={() => {
   57             localStorage.removeItem('GEMINI_API_KEY');
   58             setApiKey('');
   59           }}
   60           style={{ marginTop: '20px', backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor:
      'pointer' }}
   61         >
   62           Logout (Remove Key)
   63         </button>
   64       </section>
   65     </>
   66   )
   67 }
   68
   69 export default App