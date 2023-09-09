export default {
  '*.ts': () => 'npm run type-check --workspaces',
  '*.{js,ts}': 'eslint --fix',
  '*': 'prettier --ignore-unknown --write',
};
