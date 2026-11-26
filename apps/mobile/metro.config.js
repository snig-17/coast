const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.unstable_enableSymlinks = true;
// Hierarchical lookup stays ON. nodeModulesPaths already pins the two roots we
// care about, and disabling the walk-up stops Metro reaching a package's own
// nested node_modules — which breaks any dependency that pins a version the
// root cannot hoist (reanimated needs semver 7; the root has 6.3.1).

module.exports = config;
