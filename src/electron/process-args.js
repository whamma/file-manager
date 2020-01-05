import Url from 'url-parse';

export const getQueryParamsFromArgs = (args, protocol) => {
  const protocolArg = args.find(arg => arg.includes(protocol));
  if (!protocolArg) {
    return null;
  }
  const url = new Url(protocolArg);
  return getUrlParams(url.query);
};

function getUrlParams(query) {
  if (!query) {
    return null;
  }
  var params = {};
  query.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(str, key, value) {
    params[key] = value;
  });
  return params;
}
