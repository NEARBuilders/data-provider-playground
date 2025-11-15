<!-- markdownlint-disable MD014 -->
<!-- markdownlint-disable MD033 -->
<!-- markdownlint-disable MD041 -->
<!-- markdownlint-disable MD029 -->

<div align="center">

  <h1 style="font-size: 2.5rem; font-weight: bold;">web4 profile template</h1>

  <p>
    <strong>customizable profile module for easy integration with module federation</strong>
  </p>

</div>

<details>
  <summary>Table of Contents</summary>

- [Getting Started](#getting-started)
  - [Installing Dependencies](#installing-dependencies)
  - [Running the Development Server](#running-the-development-server)
  - [Customizing Your Profile](#customizing-your-profile)
- [Module Federation Configuration](#module-federation-configuration)
- [Theming and Styling](#theming-and-styling)
- [Building for Production](#building-for-production)
- [Deploy to Web4](#deploy-to-web4)
- [Contributing](#contributing)

</details>

## Getting Started

### Installing Dependencies

Install the dependencies using your preferred package manager:

```bash
# Using npm
npm install

# Using yarn
yarn install

# Using pnpm
pnpm install

# Using bun
bun install
```

> Note: While you can use any package manager locally, the git workflows use bun.

### Running the Development Server

Start the development server on `localhost:5170`:

```bash
# Using npm
npm run dev

# Using yarn
yarn dev

# Using pnpm
pnpm dev

# Using bun
bun run dev
```

The development server is configured with hot module replacement for a smooth development experience.

### Customizing Your Profile

1. Open `src/components/Profile.tsx` to modify the main profile component.
2. Update styles in `src/index.css` or use Tailwind classes directly in your components.
3. Adjust the theme in `tailwind.config.js` to match your desired look and feel.

## Module Federation Configuration

This template is set up for [module federation](https://module-federation.io/). The configuration can be found in `rsbuild.config.ts`. Key points:

- The profile module is exposed as `"./Profile"`
- It shares dependencies with the host/"gateway"
- Feel free to install other packages and add components to the Profile, but do not modify [App](./src/App.tsx) or [bootstrap](./src/bootstrap.tsx).

## Building for Production

To create a production build:

```bash
# Using npm
npm run build

# Using yarn
yarn build

# Using pnpm
pnpm build

# Using bun
bun run build
```

This will generate optimized files in the `dist` directory.

## Deploy to web4

To deploy your profile to web4, make sure you have built the project, then:

1. Run the deploy script:

```bash
bun run deploy
```

2. Follow the prompts in the terminal:

   - Enter the network (mainnet/testnet)
   - Enter your account name (e.g., root.near)

The script will automatically:

- Create a web4 subaccount if it doesn't exist
- Deploy your profile to the web4 contract

You will be prompted to sign transactions through [near-cli-rs](https://github.com/near/near-cli-rs)

After successful deployment, your website will be accessible at:

- Testnet: `ACCOUNT_NAME.testnet.page`
- Mainnet: `ACCOUNT_NAME.near.page`

## Contributing

We welcome contributions! Please read our [contribution guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

<div align="right">
<a href="https://nearbuilders.org" target="_blank">
<img
  src="https://builders.mypinata.cloud/ipfs/QmWt1Nm47rypXFEamgeuadkvZendaUvAkcgJ3vtYf1rBFj"
  alt="Near Builders"
  height="40"
/>
</a>
</div>
