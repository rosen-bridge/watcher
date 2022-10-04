export default {
  '*.ts': () => 'tsc --noEmit',
  '*.{js,ts}': 'eslint --fix',
  '*': 'prettier --ignore-unknown --write',
};
