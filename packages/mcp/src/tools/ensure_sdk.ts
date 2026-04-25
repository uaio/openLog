import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { networkInterfaces } from 'os';
import { API_BASE_URL } from '../config.js';

interface EnsureSdkResult {
  detected: boolean;
  framework: 'html' | 'react' | 'vue' | 'next' | 'nuxt' | 'svelte' | 'angular' | 'unknown';
  entryFile: string | null;
  injected: boolean;
  injectionCode: string;
  instructions: string;
  serverAddresses: string[];
}

type EnsureSdkMode = 'check' | 'inject' | 'auto';

function getAllLanIps(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i!.address);
}

function getPort(): number {
  try {
    const url = new URL(API_BASE_URL);
    return parseInt(url.port, 10) || 38291;
  } catch {
    return 38291;
  }
}

function detectFramework(projectDir: string): EnsureSdkResult['framework'] {
  const pkgPath = join(projectDir, 'package.json');
  if (!existsSync(pkgPath)) return 'html';

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (allDeps['next']) return 'next';
  if (allDeps['nuxt'] || allDeps['nuxt3']) return 'nuxt';
  if (allDeps['svelte'] || allDeps['@sveltejs/kit']) return 'svelte';
  if (allDeps['@angular/core']) return 'angular';
  if (allDeps['vue'] || allDeps['@vue/cli-service'] || allDeps['vite-plugin-vue']) return 'vue';
  if (allDeps['react'] || allDeps['react-dom']) return 'react';
  if (existsSync(join(projectDir, 'index.html'))) return 'html';

  return 'unknown';
}

function findEntryFile(projectDir: string, framework: EnsureSdkResult['framework']): string | null {
  const candidates: string[] = [];

  switch (framework) {
    case 'html':
      candidates.push('index.html', 'public/index.html');
      break;
    case 'react':
      candidates.push(
        'src/main.tsx',
        'src/main.ts',
        'src/main.jsx',
        'src/main.js',
        'src/index.tsx',
        'src/index.ts',
        'src/index.jsx',
        'src/index.js',
        'public/index.html',
        'index.html',
      );
      break;
    case 'vue':
      candidates.push('src/main.ts', 'src/main.js', 'public/index.html', 'index.html');
      break;
    case 'next':
      candidates.push(
        'src/app/layout.tsx',
        'src/app/layout.js',
        'app/layout.tsx',
        'app/layout.js',
        'src/pages/_app.tsx',
        'src/pages/_app.js',
        'pages/_app.tsx',
        'pages/_app.js',
      );
      break;
    case 'nuxt':
      candidates.push('app.vue', 'layouts/default.vue', 'plugins/openlog.ts', 'plugins/openlog.js');
      break;
    case 'svelte':
      candidates.push('src/main.ts', 'src/main.js', 'src/routes/+layout.svelte');
      break;
    case 'angular':
      candidates.push('src/main.ts', 'src/main.js');
      break;
    default:
      candidates.push(
        'src/main.ts',
        'src/main.js',
        'src/index.ts',
        'src/index.js',
        'index.html',
        'public/index.html',
      );
  }

  for (const c of candidates) {
    if (existsSync(join(projectDir, c))) return c;
  }
  return null;
}

function checkSdkPresent(projectDir: string, entryFile: string | null): boolean {
  // Check package.json dependencies
  const pkgPath = join(projectDir, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (allDeps['@openlogs/sdk'] || allDeps['openlog']) return true;
  }

  // Check entry file for OpenLog references
  if (entryFile) {
    const fullPath = join(projectDir, entryFile);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, 'utf-8');
      if (content.includes('OpenLog') || content.includes('openlog')) return true;
    }
  }

  // Check common HTML files for CDN script tag
  const htmlCandidates = ['index.html', 'public/index.html'];
  for (const h of htmlCandidates) {
    const fullPath = join(projectDir, h);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, 'utf-8');
      if (content.includes('openlog')) return true;
    }
  }

  return false;
}

function generateCdnSnippet(wsAddress: string): string {
  return `<script src="https://unpkg.com/@openlogs/sdk@latest/dist/openlog.iife.js"></script>
<script>
  OpenLog.init({
    projectId: '${getProjectId()}',
    server: '${wsAddress}',
    lang: 'zh'
  })
</script>`;
}

function generateNpmSnippet(wsAddress: string): string {
  return `import OpenLog from '@openlogs/sdk'

OpenLog.init({
  projectId: '${getProjectId()}',
  server: '${wsAddress}',
  lang: 'zh'
})`;
}

function getProjectId(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
    return pkg.name || 'my-app';
  } catch {
    return 'my-app';
  }
}

function injectIntoHtml(projectDir: string, entryFile: string, wsAddress: string): boolean {
  const fullPath = join(projectDir, entryFile);
  if (!existsSync(fullPath)) return false;

  let content = readFileSync(fullPath, 'utf-8');
  const snippet = generateCdnSnippet(wsAddress);

  if (content.includes('</head>')) {
    content = content.replace('</head>', `  ${snippet}\n  </head>`);
  } else if (content.includes('</body>')) {
    content = content.replace('</body>', `  ${snippet}\n  </body>`);
  } else {
    content = snippet + '\n' + content;
  }

  writeFileSync(fullPath, content, 'utf-8');
  return true;
}

export const ensureSdk = {
  name: 'ensure_sdk',
  description: `Detect whether the user's project has the openLog SDK integrated. If not, provide injection code or auto-inject it based on the project framework (HTML/React/Vue/Next.js/etc). Call this before any debugging/monitoring operation to ensure the SDK is ready.`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      projectDir: {
        type: 'string' as const,
        description: 'Absolute path to the user project directory (defaults to cwd)',
      },
      mode: {
        type: 'string' as const,
        enum: ['check', 'inject', 'auto'],
        description:
          'check = only detect; inject = detect and auto-inject into HTML files; auto = detect and return injection guidance (default)',
      },
      server: {
        type: 'string' as const,
        description: 'WebSocket server address (defaults to auto-detected LAN IP)',
      },
    },
    required: [],
  },

  async execute(args: {
    projectDir?: string;
    mode?: EnsureSdkMode;
    server?: string;
  }): Promise<EnsureSdkResult> {
    const projectDir = args.projectDir ? resolve(args.projectDir) : process.cwd();
    const mode = args.mode || 'auto';
    const port = getPort();
    const lanIps = getAllLanIps();
    const serverAddresses = lanIps.map((ip) => `ws://${ip}:${port}`);
    const wsAddress = args.server || serverAddresses[0] || `ws://localhost:${port}`;

    const framework = detectFramework(projectDir);
    const entryFile = findEntryFile(projectDir, framework);
    const detected = checkSdkPresent(projectDir, entryFile);

    // SDK already present
    if (detected) {
      return {
        detected: true,
        framework,
        entryFile,
        injected: false,
        injectionCode: '',
        instructions: 'openLog SDK is already integrated in this project. Ready to use.',
        serverAddresses,
      };
    }

    // Generate injection code based on framework
    const isHtmlTarget = framework === 'html' || (entryFile?.endsWith('.html') ?? false);
    const injectionCode = isHtmlTarget
      ? generateCdnSnippet(wsAddress)
      : generateNpmSnippet(wsAddress);

    // Mode: check — only report
    if (mode === 'check') {
      return {
        detected: false,
        framework,
        entryFile,
        injected: false,
        injectionCode,
        instructions: buildInstructions(framework, entryFile, wsAddress, false),
        serverAddresses,
      };
    }

    // Mode: inject — auto-inject into HTML files
    if (mode === 'inject' && isHtmlTarget && entryFile) {
      const injected = injectIntoHtml(projectDir, entryFile, wsAddress);
      return {
        detected: false,
        framework,
        entryFile,
        injected,
        injectionCode,
        instructions: injected
          ? `✅ openLog SDK has been injected into ${entryFile}. Reload the page on your mobile device to connect.`
          : buildInstructions(framework, entryFile, wsAddress, false),
        serverAddresses,
      };
    }

    // Mode: auto — return guidance (for npm projects, Claude should insert code)
    return {
      detected: false,
      framework,
      entryFile,
      injected: false,
      injectionCode,
      instructions: buildInstructions(framework, entryFile, wsAddress, true),
      serverAddresses,
    };
  },
};

function buildInstructions(
  framework: EnsureSdkResult['framework'],
  entryFile: string | null,
  wsAddress: string,
  isAuto: boolean,
): string {
  const lines: string[] = [];

  lines.push(`openLog SDK is NOT detected in this project (framework: ${framework}).`);

  switch (framework) {
    case 'html':
      lines.push(
        `\nAdd the following CDN snippet to ${entryFile || 'index.html'} before </head> or </body>:`,
      );
      lines.push(generateCdnSnippet(wsAddress));
      if (isAuto) lines.push(`\nTip: Call ensure_sdk with mode="inject" to auto-inject.`);
      break;

    case 'react':
    case 'vue':
    case 'svelte':
    case 'angular':
      lines.push(`\nStep 1: Install the SDK`);
      lines.push(`  npm install @openlogs/sdk`);
      lines.push(`\nStep 2: Add the following to ${entryFile || 'your entry file'}:`);
      lines.push(generateNpmSnippet(wsAddress));
      if (isAuto)
        lines.push(`\nAs the AI agent, you should insert this code into the entry file directly.`);
      break;

    case 'next':
      lines.push(`\nStep 1: Install the SDK`);
      lines.push(`  npm install @openlogs/sdk`);
      lines.push(
        `\nStep 2: For Next.js, add the SDK in your root layout (${entryFile || 'app/layout.tsx'}):`,
      );
      lines.push(
        `  - Import dynamically: const OpenLog = dynamic(() => import('@openlogs/sdk'), { ssr: false })`,
      );
      lines.push(`  - Or use a client component wrapper to call OpenLog.init()`);
      lines.push(generateNpmSnippet(wsAddress));
      break;

    case 'nuxt':
      lines.push(`\nStep 1: Install the SDK`);
      lines.push(`  npm install @openlogs/sdk`);
      lines.push(`\nStep 2: Create a Nuxt plugin at plugins/openlog.client.ts:`);
      lines.push(
        `  export default defineNuxtPlugin(() => {\n    ${generateNpmSnippet(wsAddress).replace(/\n/g, '\n    ')}\n  })`,
      );
      break;

    default:
      lines.push(`\nOption A (CDN — simplest):`);
      lines.push(generateCdnSnippet(wsAddress));
      lines.push(`\nOption B (npm):`);
      lines.push(`  npm install @openlogs/sdk`);
      lines.push(generateNpmSnippet(wsAddress));
  }

  lines.push(`\nAvailable server addresses for mobile connection:`);
  const ips = getAllLanIps();
  const port = getPort();
  if (ips.length > 0) {
    ips.forEach((ip) => lines.push(`  ws://${ip}:${port}`));
  } else {
    lines.push(`  ws://localhost:${port}`);
  }

  return lines.join('\n');
}
