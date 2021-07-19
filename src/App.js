import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'

import { Web3ReactProvider } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'

import TokenSelect from './components/TokenSelect';

function getLibrary(provider){
  const library = new Web3Provider(provider)
  library.pollingInterval = 12000
  return library
}

function App() {
  
  return (
    <div className="App">
      <Web3ReactProvider getLibrary={getLibrary}>
        <h2>🧹 Wallet Cleaner</h2>
        <TokenSelect />
      </Web3ReactProvider>        
    </div>
  );
}

export default App;
