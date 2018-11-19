import assert from 'assert';
import { Client } from '../lib';
import nock from 'nock';
import sinon from 'sinon';

describe('request-opts', () => {
  it('should be able to change request options', () => {
    const jsonReviver = sinon.stub().returnsArg(1);

    nock('https://api.intercom.io').get('/admins/baz').reply(200, {});
    const client = new Client('foo', 'bar')
      .usePromises()
      .useRequestOpts({
        jsonReviver
      });

    return client.admins.find('baz').then(r => {
      assert.equal(200, r.statusCode);
      sinon.assert.called(jsonReviver);
    });
  });
  it('should not be able to change request baseUrl option', () => {
    nock('https://api.intercom.io').get('/admins/baz').reply(200, {});
    const client = new Client('foo', 'bar')
      .usePromises()
      .useRequestOpts({
        baseUrl: 'http://local.test-server.com'
      });

    return client.admins.find('baz').then(r => {
      assert.equal(200, r.statusCode);
    });
  });
  it('should be able to change request options merging in headers', () => {
    const jsonReviver = sinon.stub().returnsArg(1);
    const customHeaderCheck = sinon.stub().returns(true);
    const userAgentHeaderCheck = sinon.stub().returns(true);
    const acceptHeaderCheck = sinon.stub().returns(true);

    nock('https://api.intercom.io', {
      reqheaders: {
        'x-intercom-header': customHeaderCheck,
        'User-Agent': userAgentHeaderCheck,
        Accept: acceptHeaderCheck
      }
    }).get('/admins/baz').reply(200, {});
    const client = new Client('foo', 'bar')
      .usePromises()
      .useRequestOpts({
        jsonReviver,
        headers: {
          Accept: 'text/plain',
          'x-intercom-header': 'bar'
        }
      });

    return client.admins.find('baz').then(r => {
      assert.equal(200, r.statusCode);
      sinon.assert.called(jsonReviver);
      // Should always have a user-agent
      sinon.assert.calledOnce(userAgentHeaderCheck);
      sinon.assert.calledWithMatch(userAgentHeaderCheck, sinon.match.string);
      // Shouldn't allow accept header to be overriden
      sinon.assert.calledOnce(acceptHeaderCheck);
      sinon.assert.calledWithExactly(acceptHeaderCheck, 'application/json');
      // Should include custom header
      sinon.assert.calledOnce(customHeaderCheck);
      sinon.assert.calledWithExactly(customHeaderCheck, 'bar');
    });
  });
});
