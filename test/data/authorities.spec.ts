import * as SUT from '../../src/data/authorities';
import { postCodeToDa } from '../../src/data/authorities';

describe('When the flag = “GGY” for a vessel', () => {
  const flag = 'GGY';

  it('will return Guernsey as an authority', () => {
    expect(SUT.getDevolvedAuthority(flag, '')).toBe('Guernsey');
    expect(SUT.getDevolvedAuthority(flag, "BELFAST")).toBe('Guernsey');
    expect(SUT.getDevolvedAuthority(flag, "ISLE OF MAN")).toBe('Guernsey');
    expect(SUT.getDevolvedAuthority(flag, "CHANNEL ISLANDS")).toBe('Guernsey');
    expect(SUT.getDevolvedAuthority(flag, "MILFORD HAVEN")).toBe('Guernsey');
    expect(SUT.getDevolvedAuthority(flag, "EYEMOUTH")).toBe('Guernsey');
  });
});

describe('When the flag = “JEY” for a vessel', () => {
  const flag = 'JEY';

  it('will return Jersey as an authority', () => {
    expect(SUT.getDevolvedAuthority(flag, '')).toBe('Jersey');
    expect(SUT.getDevolvedAuthority(flag, "BELFAST")).toBe('Jersey');
    expect(SUT.getDevolvedAuthority(flag, "ISLE OF MAN")).toBe('Jersey');
    expect(SUT.getDevolvedAuthority(flag, "CHANNEL ISLANDS")).toBe('Jersey');
    expect(SUT.getDevolvedAuthority(flag, "MILFORD HAVEN")).toBe('Jersey');
    expect(SUT.getDevolvedAuthority(flag, "EYEMOUTH")).toBe('Jersey');
  });
});

describe('When the flag is empty', () => {
  const flag = '';

  it('will return England as a default authority', () => {
    const adminPort = '';
    expect(SUT.getDevolvedAuthority(flag, adminPort)).toBe('England');
  });

  it('will return Northern Ireland', () => {
    const adminPort = "BELFAST";
    expect(SUT.getDevolvedAuthority(flag, adminPort)).toBe('Northern Ireland');
  });

  it('will return Isle of Man', () => {
    const adminPort = "ISLE OF MAN";
    expect(SUT.getDevolvedAuthority(flag, adminPort)).toBe('Isle of Man');
  });

  it('will return Channel Islands', () => {
    const adminPort = "CHANNEL ISLANDS";
    expect(SUT.getDevolvedAuthority(flag, adminPort)).toBe('Channel Islands');
  });

  it('will return Wales', () => {
    const adminPort = "MILFORD HAVEN";
    expect(SUT.getDevolvedAuthority(flag, adminPort)).toBe('Wales');
  });

  it('will return Wales', () => {
    const adminPort = "EYEMOUTH";
    expect(SUT.getDevolvedAuthority(flag, adminPort)).toBe('Scotland');
  });
});

describe('unit tests on postcode lookup', () => {

  const lookup = SUT.postCodeDaLookup(
    {
      'NE' : { authority: 'The Real England' },
      'M'  : { authority: 'The Real England' },
      'XX' : { authority: 'Airstrip One' }
    })

  it('will find a single character area', () => {
    expect(lookup('M1 1AA')).toBe('The Real England')
  })

  it('will find a double character area', () => {
    expect(lookup('NE4 7YJ')).toBe('The Real England')
  })

  it('will find ignore the case', () => {
    expect(lookup('ne4 7YJ')).toBe('The Real England')
  })

  it('will find ignore mixed case', () => {
    expect(lookup('nE4 7YJ')).toBe('The Real England')
  })

  it('will fallback to England if postcode does not exist', () => {
    expect(lookup('QR4 7YL')).toBe('England')
  })

  it('will fallback to England not a postcode', () => {
    expect(lookup('111')).toBe('England')
  })

});

describe('test postcode against complete postcode mapping', () => {

  const lookup = SUT.postCodeDaLookup( postCodeToDa )

  it('will find a postcode in isle of mann', () => {

    expect(lookup('IM1 3DU')).toBe('Isle of Man')
  })

});