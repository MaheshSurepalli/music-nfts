const {expect} = require("chai");

const toWei = (num)=>ethers.utils.parseEther(num.toString());

const fromWei = (num)=> ethers.utils.formatEther(num);

describe("MusicNFTMarketplace", function () {

    let nftMarketplace
    let deployer, artist, user1, user2, users;
    let royaltyFee = toWei(0.01); // 1 ether = 10^18 wei
    let URI = "https://bafybeidhjjbjonyqcahuzlpt7sznmh4xrlbspa3gstop5o47l6gsiaffee.ipfs.nftstorage.link/"
    let prices = [toWei(1), toWei(2), toWei(3), toWei(4), toWei(5), toWei(6), toWei(7), toWei(8)]
    let deploymentFees = toWei(prices.length * 0.01)
    beforeEach(async function () {
     
      const NFTMarketplaceFactory = await ethers.getContractFactory("MusicNFTMarketplace");
      [deployer, artist, user1, user2, ...users] = await ethers.getSigners();
  
      
      nftMarketplace = await NFTMarketplaceFactory.deploy(
        royaltyFee,
        artist.address,
        prices,
        { value: deploymentFees }
      );
  
    });



    describe("Deployment", function () {

        it("Should track name, symbol, URI, royalty fee and artist", async function () {
          const nftName = "DAppFi"
          const nftSymbol = "DAPP"
          expect(await nftMarketplace.name()).to.equal(nftName);
          expect(await nftMarketplace.symbol()).to.equal(nftSymbol);
          expect(await nftMarketplace.baseURI()).to.equal(URI);
          expect(await nftMarketplace.royaltyFee()).to.equal(royaltyFee);
          expect(await nftMarketplace.artist()).to.equal(artist.address);
        });

        it("Should mint then list all the music nfts", async function () {
            expect(await nftMarketplace.balanceOf(nftMarketplace.address)).to.equal(8);
            // Get each item from the marketItems array then check fields to ensure they are correct
            await Promise.all(prices.map(async (i, indx) => {
              const item = await nftMarketplace.marketItems(indx)
              expect(item.tokenId).to.equal(indx)
              expect(item.seller).to.equal(deployer.address)
              expect(item.price).to.equal(i)
            }))
          });
          it("Ether balance should equal deployment fees", async function () {
            expect(await ethers.provider.getBalance(nftMarketplace.address)).to.equal(deploymentFees)
          });

    });

    describe("Updating royaly fee", function () {
        it("Only deployer should be able to update royaly fee", async function () {
            const fee = toWei(0.02)
            await nftMarketplace.updateRoyaltyFee(fee)
            await nftMarketplace.getAllUnsoldTokens()
            await expect(
              nftMarketplace.connect(user1).updateRoyaltyFee(fee)
            ).to.be.revertedWith("Ownable: caller is not the owner");
            expect(await nftMarketplace.royaltyFee()).to.equal(fee)
        });
    });

    describe("Buying tokens", function () {
        it("Should update seller to zero address, transfer NFT, pay seller, pay royalty to artist and emit a MarketItemBought even", async function (){
            const deployerIntialEthBal = await deployer.getBalance()
            const artistIntialEthBal = await artist.getBalance()

            await expect(nftMarketplace.connect(user1).buyToken(0,{ value: prices[0]}))
            .to.emit(nftMarketplace,"MarketItemBought")
            .withArgs(
                0,
                deployer.address,
                user1.address,
                prices[0]
            )
            const deployerFinalEthBal = await deployer.getBalance()
      const artistFinalEthBal = await artist.getBalance()
      
      expect((await nftMarketplace.marketItems(0)).seller).to.equal("0x0000000000000000000000000000000000000000")
      
      expect(+fromWei(deployerFinalEthBal)).to.equal(+fromWei(prices[0]) + +fromWei(deployerIntialEthBal))
     
      expect(+fromWei(artistFinalEthBal)).to.equal(+fromWei(royaltyFee) + +fromWei(artistIntialEthBal))
      
      expect(await nftMarketplace.ownerOf(0)).to.equal(user1.address);
        })

        it("Should fail when ether amount sent with transaction does not equal asking price", async function () {
            
            await expect(
              nftMarketplace.connect(user1).buyToken(0, { value: prices[1] })
            ).to.be.revertedWith("Please send the asking price in order to complete the purchase");
          });
    })

    describe("Reselling tokens", function () {
      beforeEach(async function () {
        // user1 purchases an item.
        await nftMarketplace.connect(user1).buyToken(0, { value: prices[0] })
      })
  
      it("Should track resale item, incr. ether bal by royalty fee, transfer NFT to marketplace and emit MarketItemRelisted event", async function () {
        const resaleprice = toWei(2)
        const initMarketBal = await ethers.provider.getBalance(nftMarketplace.address)
        // user1 lists the nft for a price of 2 hoping to flip it and double their money
        await expect(nftMarketplace.connect(user1).resellToken(0, resaleprice, { value: royaltyFee }))
          .to.emit(nftMarketplace, "MarketItemRelisted")
          .withArgs(
            0,
            user1.address,
            resaleprice
          )
        const finalMarketBal = await ethers.provider.getBalance(nftMarketplace.address)
        // Expect final market bal to equal inital + royalty fee
        expect(+fromWei(finalMarketBal)).to.equal(+fromWei(royaltyFee) + +fromWei(initMarketBal))
        // Owner of NFT should now be the marketplace
        expect(await nftMarketplace.ownerOf(0)).to.equal(nftMarketplace.address);
        // Get item from items mapping then check fields to ensure they are correct
        const item = await nftMarketplace.marketItems(0)
        expect(item.tokenId).to.equal(0)
        expect(item.seller).to.equal(user1.address)
        expect(item.price).to.equal(resaleprice)
      });
  
      it("Should fail if price is set to zero and royalty fee is not paid", async function () {
        await expect(
          nftMarketplace.connect(user1).resellToken(0, 0, { value: royaltyFee })
        ).to.be.revertedWith("Price must be greater than zero");
        await expect(
          nftMarketplace.connect(user1).resellToken(0, toWei(1), { value: 0 })
        ).to.be.revertedWith("Must pay royalty");
      });
    });

})