
import logo from './logo.png';
import './App.css';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import {useState} from 'react';
import {ethers} from 'ethers';
import {Spinner, Button, Container, Nav, Navbar } from 'react-bootstrap';
import NavbarToggle from 'react-bootstrap/esm/NavbarToggle';
import MusicNFTMarketplaceAbi from '../contractsData/MusicNFTMarketplace.json'
import MusicNFTMarketplaceAddress from '../contractsData/MusicNFTMarketplace-address.json'
import React from 'react';
import Home from './Home.js';
import MyTokens from './MyTokens.js';
import MyResales from './MyResales.js';
 
function App() {
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState(null)
  const [contract, setContract] = useState({})

  const web3Handler = async () => {
    const accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
    setAccount(accounts[0])
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    loadContract(signer)
  }

  const loadContract = async (signer) => {
      const contract = new ethers.Contract(MusicNFTMarketplaceAddress.address, MusicNFTMarketplaceAbi.abi, signer);
      setContract(contract)
      setLoading(false)
  }
  return (
    <BrowserRouter>
      <div className="App">
        <>
          <Navbar expand="lg" bg="secondary" variant="dark">
            <Container>
            <Navbar.Brand>
                <img src={logo} width="40" height="40" className="" alt="" />
                &nbsp; Music NFT player
              </Navbar.Brand>
              <Navbar.Toggle aria-controls="responsive-navbar-nav"></Navbar.Toggle>
              <Navbar.Collapse id="responsive-navbar-nav">
                <Nav className="me-auto">
                  <Nav.Link as={Link} to ="/">Home</Nav.Link>
                  <Nav.Link as={Link} to ="/my-tokens">My Tokens</Nav.Link>
                  <Nav.Link as={Link} to ="/my-resales">My Resales</Nav.Link>
                </Nav>
                <Nav>
                  {account ? (
                    <Nav.Link href={`https://etherscan.io/address/${account}`
                  }
                  target = "_blank"
                    rel = "noopener noreferrer"
                    className = "button nav-button btn-sm mx-4">
                      <Button variant = "outline-light">
                        {account.slice(0,5)+'...'+account.slice(38,42)}
                        </Button>
                       </Nav.Link> 
                  ):(
                    <Button onClick = {web3Handler} variant = "outline-light">Connect Wallet</Button>
                  )}
                </Nav>
              </Navbar.Collapse>
            </Container>

          </Navbar>
        </>
        <div>
          {loading? (
            <div style={{display:'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh'}}>
              <Spinner animation = "border" style={{display: 'flex'}}/>
              <a className='mx- my-0'>Awaiting Metmask connection</a>
              </div> 
          ):(
            <Routes>
              <Route path="/" element = {
                <Home contract = {contract}></Home>
              }></Route>
              <Route path="/my-tokens" element = {
                <MyTokens contract = {contract}></MyTokens>
              }></Route>
              <Route path="/my-resales" element = {
                <MyResales contract = {contract}></MyResales>
              }></Route>
            </Routes>
          )}
          </div>

      </div>
    </BrowserRouter>
  );
}

export default App;
