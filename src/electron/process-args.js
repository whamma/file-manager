import Url from 'url-parse';

export const getQueryParamsFromArgs = (args, protocol) => {
  const protocolArg = findProtocolArg(args, protocol);
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

export const findProtocolArg = (args, protocol) => {
  const protocolArg = args.find(arg => arg.includes(protocol));
  if (!protocolArg) {
    return null;
  }
  return protocolArg;
}

export const containedProtocolArg = (args, protocol) => {
  return findProtocolArg(args, protocol) !== null;
}

export const replaceProtocolArg = (args, protocol, url) => {
  const urlIndex = args.findIndex(arg => arg.includes(protocol));
  if(urlIndex < 0 || urlIndex >= args.length) {
    return args;
  }
  const newArgs = [...args].splice(urlIndex, 1);
  newArgs.push(url);
  return newArgs;
}
