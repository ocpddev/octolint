import load from '@commitlint/load';
import lint from '@commitlint/lint';

const config = await load.default({
  extends: ['@commitlint/config-conventional'],
  rules: {
    'footer-max-line-length': [0],
    'body-max-line-length': [0],
  },
});

export default function (msg: string) {
  return lint.default(
    msg,
    config.rules,
    config.parserPreset ? { parserOpts: config.parserPreset.parserOpts as any } : {},
  );
}
