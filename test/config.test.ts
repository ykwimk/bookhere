// next.config 의 htmlLimitedBots 는 Next 기본 목록을 복사한 것이다. Next 를 올려 기본 목록이 바뀌면 여기서 실패한다 → next.config.ts 를 다시 복사
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HTML_LIMITED_BOT_UA_RE } from 'next/dist/shared/lib/router/utils/html-bots.js';
import nextConfig from '../next.config.ts';

test('htmlLimitedBots: Next 기본 목록 + Googlebot, 사람 브라우저는 빠짐', () => {
  const re = nextConfig.htmlLimitedBots as RegExp;
  assert.equal(re.source, `Googlebot|${HTML_LIMITED_BOT_UA_RE.source}`);
  assert.ok(
    re.test(
      'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    ),
  );
  assert.ok(
    !re.test(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    ),
  );
});
