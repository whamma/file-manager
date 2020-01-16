import _ from 'lodash/core';

export const secToStr = (seconds, { hSep, mSep, sSep }) => {
  let timeStr = '';
  let hh, mm, ss;
  if (seconds <= 0) {
    return '';
  }

  ss = seconds;
  if (ss > 3600) {
    hh = Math.floor(ss / 3600);
    ss = ss - hh * 3600;
  }

  if (ss > 60) {
    mm = Math.floor(ss / 60);
    ss = ss - mm * 60;
  }

  if (_.isEmpty(hSep) || _.isEmpty(mSep) || _.isEmpty(sSep)) {
    hSep = ':';
    mSep = ':';
    mSep = ':';
  }

  if (hh) {
    timeStr = `${hh}${hSep} `;
  }
  if (mm) {
    timeStr += `${mm}${mSep}`;
  }
  if (ss) {
    timeStr += `${ss}${sSep}`;
  }
  return timeStr;
};
