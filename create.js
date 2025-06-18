// init-structure.js
// 运行命令: node init-structure.js
// 使用了 ES Module (import) 语法来兼容项目设置

import fs from 'fs';
import path from 'path';
import {
  fileURLToPath
} from 'url';

const __filename = fileURLToPath(
  import.meta.url);
const __dirname = path.dirname(__filename);

const structure = {
  'api': {
    'index.ts': '',
    'request.ts': '// Axios instance and interceptors',
    'auth.ts': '// Auth related API calls',
    'admin.ts': '// Admin related API calls',
    'log.ts': '// Log related API calls',
    'project.ts': '// Project related API calls',
  },
  'assets': {
    'images': {},
    'styles': {
      'main.css': '/* Global styles */'
    }
  },
  'components': {
    'shared': {},
    'features': {},
  },
  'composables': {
    'useAuth.ts': '// Auth-related composables'
  },
  'layouts': {
    'MainLayout.vue': '<template><div>Main Layout</div></template>',
    'AuthLayout.vue': '<template><div>Auth Layout</div></template>',
  },
  'router': {
    'index.ts': '// Vue Router configuration',
  },
  'stores': {
    'index.ts': '',
    'user.ts': '// User state management (Pinia)',
    'app.ts': '// App state management (Pinia)',
  },
  'types': {
    'api.ts': '// API type definitions',
    'index.ts': '',
  },
  'utils': {
    'index.ts': '// Utility functions',
  },
  'views': {
    'auth': {
      'Login.vue': '',
      'Register.vue': '',
    },
    'admin': {
      'UserManagement.vue': '',
      'RoleManagement.vue': '',
      'LogViewer.vue': '',
    },
    'project': {
      'ProjectList.vue': '',
      'ProjectDetail.vue': '',
    },
    'dashboard': {
      'index.vue': '',
    },
    'errors': {
      'NotFound.vue': '<template><h1>404 - Not Found</h1></template>'
    }
  },
};

function createStructure(basePath, struct) {
  Object.keys(struct).forEach(name => {
    const newPath = path.join(basePath, name);
    const value = struct[name];

    if (typeof value === 'object' && value !== null) {
      // It's a directory
      if (!fs.existsSync(newPath)) {
        fs.mkdirSync(newPath);
        console.log(`Created directory: ${newPath}`);
      }
      createStructure(newPath, value);
    } else {
      // It's a file
      if (!fs.existsSync(newPath)) {
        fs.writeFileSync(newPath, value, 'utf8');
        console.log(`Created file: ${newPath}`);
      }
    }
  });
}

const srcPath = path.join(__dirname, 'src');
createStructure(srcPath, structure);

console.log('\nProject structure created successfully!');
