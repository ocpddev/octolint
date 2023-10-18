import load from '@commitlint/load';
import { default as _lint } from '@commitlint/lint';
import format from '@commitlint/format';

const config = await load.default({
  extends: ['@commitlint/config-conventional'],
  rules: {
    'footer-max-line-length': [0],
    'body-max-line-length': [0],
  },
});

export type LintResult = {
  valid: boolean;
  title: string;
  summary: string;
};

export async function lint(messages: string[]): Promise<LintResult> {
  const results = await Promise.all(
    messages.map((msg) => _lint.default(msg, config.rules, config.parserPreset?.parserOpts ?? {})),
  );
  const valid = results.every((r) => r.valid);
  return {
    valid,
    title: valid ? 'Commit message is valid' : 'Commit message is invalid',
    summary: format.default({ results }, { color: false }),
  };
}
