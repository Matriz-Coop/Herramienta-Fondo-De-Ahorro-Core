import { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import StakingToken from './contracts/StakingToken.json';
import StakingDapp from './contracts/StakingDapp.json';
import RewardToken from './contracts/RewardToken.json';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Modal from './components/Modal';
import './App.css';

const stakingDappAddress = '0x7F15ab8c28DDaBC1b8840d3d3658C7549ed2f99B';
const stakingTokenAddress = '0xb99C4b42259617b531e2f9f9defd4Ebe91C515d7';
const rewardTokenAddress = '0x26E3F3259EF1e94b96E5EFCA875EDf90c63A1DA3'; 

function App() {
  const [stakingAmount, setStakingAmount] = useState('');
  const [unstakingAmount, setUnstakingAmount] = useState('');
  const [currentAccount, setCurrentAccount] = useState(null);
  const [stakedAmount, setStakedAmount] = useState('0');
  const [rewardAmount, setRewardAmount] = useState('0');
  const [totalStkBalance, setTotalStkBalance] = useState('0');
  const [network, setNetwork] = useState('');
  const [faucetAmount, setFaucetAmount] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stakingTokenDecimals, setStakingTokenDecimals] = useState(18);
  const [rewardTokenDecimals, setRewardTokenDecimals] = useState(18);

  
  // Check if wallet is connected
  const checkWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log('Make sure you have Metamask installed!');
      return;
    }

    try {
      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        setCurrentAccount(account);
      } else {
        console.log('No authorized account found');
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  // Check network
  const checkNetwork = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log('Ethereum object does not exist');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const { chainId } = await provider.getNetwork();

      if (chainId !== 1115) {
        alert('Please connect to the Core Testnet');
      } else {
        setNetwork('Core Testnet');
      }
    } catch (error) {
      console.error('Error fetching network:', error);
    }
  };

  // Connect wallet
  const connectWalletHandler = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      alert('Please install Metamask!');
      return;
    }

    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Disconnect wallet
  const disconnectWalletHandler = () => {
    setCurrentAccount(null);
    setStakedAmount('0');
    setRewardAmount('0');
    setTotalStkBalance('0');
    setNetwork('');
  };

  // Fetch staked and reward amounts
  const fetchStakedAndRewardAmounts = useCallback(async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const stakingDappContract = new ethers.Contract(stakingDappAddress, StakingDapp.abi, signer);

        const stakedAmount = await stakingDappContract.getStakedAmount(currentAccount);
        const rewardAmount = await stakingDappContract.getRewardAmount(currentAccount);

        setStakedAmount(ethers.utils.formatUnits(stakedAmount, stakingTokenDecimals));
        setRewardAmount(ethers.utils.formatUnits(rewardAmount, rewardTokenDecimals));
      } else {
        console.log('Ethereum object does not exist');
      }
    } catch (error) {
      console.error('Error fetching staked and reward amounts:', error);
    }
  }, [currentAccount, stakingTokenDecimals, rewardTokenDecimals]);

  // Fetch staking token balance
  const fetchStkBalance = useCallback(async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const stakingTokenContract = new ethers.Contract(stakingTokenAddress, StakingToken.abi, provider);

        const balance = await stakingTokenContract.balanceOf(currentAccount);
        const decimals = await stakingTokenContract.decimals();
        setStakingTokenDecimals(decimals);
        setTotalStkBalance(ethers.utils.formatUnits(balance, decimals));
      } else {
        console.log('Ethereum object does not exist');
      }
    } catch (error) {
      console.error('Error fetching token balance:', error);
    }
  }, [currentAccount]);

  // Fetch reward token decimals
  const fetchRewardTokenDecimals = useCallback(async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const rewardTokenContract = new ethers.Contract(rewardTokenAddress, RewardToken.abi, provider);

        const decimals = await rewardTokenContract.decimals();
        setRewardTokenDecimals(decimals);
      } else {
        console.log('Ethereum object does not exist');
      }
    } catch (error) {
      console.error('Error fetching reward token decimals:', error);
    }
  }, []);

  useEffect(() => {
    checkWalletIsConnected();
  }, []);

  useEffect(() => {
    if (currentAccount) {
      checkNetwork();
      fetchStakedAndRewardAmounts();
      fetchStkBalance();
      fetchRewardTokenDecimals();
    }
  }, [currentAccount, fetchStakedAndRewardAmounts, fetchStkBalance, fetchRewardTokenDecimals]);


  // Stake tokens
  const stakeTokens = async () => {
    try {
      if (!isValidAmount(stakingAmount)) {
        toast.error('Invalid staking amount. Please enter a positive number.');
        return;
      }

      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const stakingDappContract = new ethers.Contract(stakingDappAddress, StakingDapp.abi, signer);
        const tokenContract = new ethers.Contract(stakingTokenAddress, StakingToken.abi, signer);

        await tokenContract.approve(stakingDappAddress, ethers.utils.parseUnits(stakingAmount, stakingTokenDecimals));
        const tx = await stakingDappContract.stake(ethers.utils.parseUnits(stakingAmount, stakingTokenDecimals));
        await tx.wait();
        toast.success('Staked successfully');
        fetchStakedAndRewardAmounts();
        fetchStkBalance();
      } else {
        console.log('Ethereum object does not exist');
      }
    } catch (error) {
      console.error('Error staking tokens:', error);
      toast.error('Error staking tokens');
    }
  };

  // Unstake tokens
  const unstakeTokens = async () => {
    try {
      if (!isValidAmount(unstakingAmount)) {
        toast.error('Invalid unstaking amount. Please enter a positive number.');
        return;
      }

      // Check if unstaking amount is greater than the staked amount
      if (parseFloat(unstakingAmount) > parseFloat(stakedAmount)) {
        toast.error('Enter value equal to or less than the Staked STK.');
        return;
      }

      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const stakingDappContract = new ethers.Contract(stakingDappAddress, StakingDapp.abi, signer);

        const amount = ethers.utils.parseUnits(unstakingAmount, stakingTokenDecimals);
        const tx = await stakingDappContract.unstake(amount);
        await tx.wait();
        toast.success('Unstaked successfully');
        fetchStakedAndRewardAmounts();
        fetchStkBalance();
      } else {
        console.log('Ethereum object does not exist');
      }
    } catch (error) {
      console.error('Error unstaking tokens:', error);
      toast.error('Error unstaking tokens');
    }
  };

  // Open reward modal
  const openRewardModal = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const stakingDappContract = new ethers.Contract(stakingDappAddress, StakingDapp.abi, signer);

        const reward = await stakingDappContract.getRewardAmount(currentAccount);
        const formattedReward = ethers.utils.formatUnits(reward, rewardTokenDecimals);
        console.log(formattedReward);
        if (parseFloat(formattedReward) > 0) {
          setRewardAmount(formattedReward);
          setIsModalOpen(true);
        } else {
          toast.info('No rewards available to claim.');
        }
      } else {
        console.log('Ethereum object does not exist');
      }
    } catch (error) {
      console.error('Error fetching reward amount:', error);
      toast.error('Error fetching reward amount');
    }
  };

  // Claim reward
  const claimReward = async () => {
    try {
      if (parseFloat(rewardAmount) <= 0) {
        toast.error('Cannot claim reward. Amount must be greater than zero.');
        return;
      }
  
      const { ethereum } = window;
  
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const stakingDappContract = new ethers.Contract(stakingDappAddress, StakingDapp.abi, signer);
  
        // Set a high manual gas limit
        const gasLimit = 5000000; // Higher limit to ensure success
  
        // Try sending the transaction with a higher gas limit
        const tx = await stakingDappContract.claimReward({
          gasLimit: gasLimit
        });
        await tx.wait();
        toast.success('Reward claimed successfully');
        setIsModalOpen(false);
        fetchStakedAndRewardAmounts();
        fetchStkBalance();
      } else {
        console.log('Ethereum object does not exist');
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error('Error claiming reward. Please check the console for details.');
    }
  };

  // Faucet tokens
  const faucetTokens = async (amount) => {
    try {
      if (!isValidAmount(amount)) {
        toast.error('Invalid faucet amount. Please enter a positive number less than 100.');
        return;
      }

      const parsedAmount = parseFloat(amount);
      if (parsedAmount >= 100) {
        toast.error('Request amount must be less than 100.');
        return;
      }

      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const stakingTokenContract = new ethers.Contract(stakingTokenAddress, StakingToken.abi, signer);

        const gasLimit = 600000;

        const tx = await stakingTokenContract.mint(currentAccount, ethers.utils.parseUnits(amount, stakingTokenDecimals), {
          gasLimit: gasLimit
        });
        await tx.wait();
        toast.success('Tokens minted successfully');
        fetchStkBalance();
      } else {
        console.log('Ethereum object does not exist');
      }
    } catch (error) {
      console.error('Error minting tokens:', error);
      toast.error('Error minting tokens');
    }
  };

  // Validate amount
  const isValidAmount = (amount) => {
    return !isNaN(Number(amount)) && parseFloat(amount) > 0;
  };

  return (
    <div
      className="App"
      style={{
        backgroundImage: "url('https://i.postimg.cc/4dgfQsGz/fondo-de-ahorro.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative", // Ensure absolute children can be positioned
      }}
    >
      {/* Caja blanca semitransparente detrás del contenido */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(255, 255, 255, 0.7)", // Caja blanca con transparencia
          zIndex: 1,
        }}
      />
      
      {/* Contenedor de contenido */}
      <div style={{ zIndex: 2, position: "relative" }}>
        <header className="App-header">
          <div className="logo-container">
            <img
              src="https://i.postimg.cc/Jn5RP7nV/Matriz-isotipo.jpg"
              alt="Matriz Isotipo"
              className="logo"
            />
          </div>
          <h1>Fondo de ahorro</h1>
  
          {/* Botón de Disconnect Wallet */}
          {currentAccount && (
            <button
              onClick={disconnectWalletHandler}
              className="btn-primary disconnect-btn"
              style={{
                position: "absolute",
                top: -80,
                right: -300,
                zIndex: 3, // Asegura que el botón esté sobre el fondo blanco
              }}
            >
              Disconnect Wallet
            </button>
          )}
        </header>
        <main>
          {!currentAccount ? (
            <button onClick={connectWalletHandler} className="btn-primary">
              Connect Wallet
            </button>
          ) : (
            <>
              <div className="ticker-container">
                <p>Saldo: {totalStkBalance} Mxn</p>
                <p>Fondo de ahorro: {stakedAmount} Mxn</p>
                <p>Ganancias generadas: {rewardAmount} Mxn</p>
                <button onClick={openRewardModal} className="btn-primary">
                  Reclamar ganancias
                </button>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Monto a guardar"
                  value={stakingAmount}
                  onChange={(e) => setStakingAmount(e.target.value)}
                  className="input-field"
                />
                <button onClick={stakeTokens} className="btn-primary">
                  Ahorrar
                </button>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Monto a retirar"
                  value={unstakingAmount}
                  onChange={(e) => setUnstakingAmount(e.target.value)}
                  className="input-field"
                />
                <button onClick={unstakeTokens} className="btn-primary">
                  Retirar
                </button>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Faucet amount"
                  value={faucetAmount}
                  onChange={(e) => setFaucetAmount(e.target.value)}
                  className="input-field"
                />
                <button onClick={() => faucetTokens(faucetAmount)} className="btn-primary">
                  TestMXN Faucet
                </button>
              </div>
            </>
          )}
        </main>
        <ToastContainer />
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onClaim={claimReward}
          rewardAmount={rewardAmount}
        />
      </div>
    </div>
  );
  
}

export default App;