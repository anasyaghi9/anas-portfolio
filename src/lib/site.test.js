import { describe, expect, it } from 'vitest';
import { localePath, parseLocalePath } from './locale.js';
import { pageMeta, sitePaths } from './meta.js';
import { formatMonth } from './utils.js';

describe('language in the address', () => {
  it('reads the language and the language-free path', () => {
    expect(parseLocalePath('/')).toEqual({ lang: 'en', path: '/' });
    expect(parseLocalePath('/projects/x/')).toEqual({ lang: 'en', path: '/projects/x' });
    expect(parseLocalePath('/ar')).toEqual({ lang: 'ar', path: '/' });
    expect(parseLocalePath('/ar/projects/x')).toEqual({ lang: 'ar', path: '/projects/x' });
    expect(parseLocalePath('/arabic')).toEqual({ lang: 'en', path: '/arabic' });
  });

  it('builds addresses for each language', () => {
    expect(localePath('/', 'ar')).toBe('/ar');
    expect(localePath('/#about', 'ar')).toBe('/ar#about');
    expect(localePath('/projects/x', 'ar')).toBe('/ar/projects/x');
    expect(localePath('/#about', 'en')).toBe('/#about');
  });
});

describe('page metadata', () => {
  it('describes a case study in Arabic with its English twin', () => {
    const meta = pageMeta('/ar/projects/little-lemon');
    expect(meta).toMatchObject({ lang: 'ar', dir: 'rtl', type: 'article', status: 200, image: '/images/little-lemon.jpg' });
    expect(meta.title).toBe('Little Lemon — أنس عطا الله ياغي');
    expect(meta.alternates).toEqual({ en: '/projects/little-lemon', ar: '/ar/projects/little-lemon' });
  });

  it('marks unknown pages and unknown case studies as 404', () => {
    expect(pageMeta('/nope')).toMatchObject({ status: 404, alternates: null });
    expect(pageMeta('/ar/projects/nope')).toMatchObject({ status: 404, lang: 'ar' });
  });

  it('treats a malformed address as 404 instead of throwing', () => {
    expect(pageMeta('/projects/%E0%A4%A')).toMatchObject({ status: 404 });
  });

  it('lists every page in both languages', () => {
    const paths = sitePaths();
    expect(paths).toHaveLength(10);
    expect(paths).toContain('/ar/projects/mealsrater-api');
  });
});

describe('formatMonth', () => {
  it('uses fixed month names so prerendered and live pages match', () => {
    expect(formatMonth('2022-09', 'en')).toBe('Sep 2022');
    expect(formatMonth('2026-08-01', 'ar')).toBe('أغسطس 2026');
    expect(formatMonth('2022-13', 'en')).toBe('2022-13');
    expect(formatMonth('Spring 2024', 'en')).toBe('Spring 2024');
  });
});
