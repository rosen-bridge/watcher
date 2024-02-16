export default {
  '*.ts': () => 'npm run type-check',
  '*.{js,ts}': 'eslint --fix',
  '*': 'prettier --ignore-unknown --write',
};
