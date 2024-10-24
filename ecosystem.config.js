module.exports = {
    apps: [
      {
        name: 'pigtap_backend',                   // The name of your application
        script: 'src/cluster.ts',            // Path to your TypeScript entry point
        interpreter: 'node',                 // Use node as the interpreter
        node_args: '--loader ts-node/esm',   // Pass the loader argument for ts-node with ESM
        watch: true,                        // Optional: Enable to restart on changes
      },
    ],
  };