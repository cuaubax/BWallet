# Bax Business Decentralizado

## Requisitos

- Node.js
- wallet (metamask o similar) con un poco de eth en Arbitrum
- API key para 0x (dm para que la comparta)

## Corriendo en local

### El repo

```bash
git clone git@github.com:cuaubax/BWallet.git

```

### Acceder al directorio del proyecto

```bash
cd BaxBWallet; cd bax-wallet

```

### Correr en modo dev 

```bash
npm run dev

```

Con eso debería de verse el proyecto en [localhost:3000](http://localhost:3000) a menos que el puerto esté ocupado, en ese caso se usará otro disponible. 

NOTA: Es necesario conectarse con metamask para poder ver el sitio completo. De lo contrario no muestra nada.

## Adding a new chain (??)

- Must add new chain in both `src/config/alchemy.tx` and `src/config/web3.ts`
- Add block explorer urls in `src/components/WalletBalance.tsx` and `src/components/TransactionHistory.tsx`

Could be done in a cleaner more centralized way. Considereing the current scope of the project, this approach is fine.

## TODO 

- Make it pretty
- Upgrade AAVE interface and look for Arbitrum alternatives
- Add/Remove contacts
- 1 to n dispersions with csv
- 1 to n dispersions supporting multiple ERC20 tokens
- Add links to relevan information (tx-hashes, addresses, etc)
- Support multiple tokens in balance information