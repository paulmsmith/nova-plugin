import fs from 'fs';
import path from 'path';
import { AbbreviationContext } from 'emmet';
import { deepStrictEqual as deepEqual } from 'assert';
import { getHTMLContext, getCSSContext } from '../src/autocomplete/context';

function read(fileName: string): string {
    const absPath = path.resolve(__dirname, fileName);
    return fs.readFileSync(absPath, 'utf8');
}

function context(name: string, attributes?: { [name: string]: string }): AbbreviationContext {
    const result = { name } as AbbreviationContext;
    if (attributes) {
        result.attributes = attributes;
    }
    return result;
}

describe('Autocomplete provider', () => {
    it('HTML context', () => {
        const html = read('./samples/embedded-style.html');

        deepEqual(getHTMLContext(html, 298), {
            syntax: 'html',
            context: context('div', { style: 'padding: 10px;' })
        });
        // Inside tag, ignore context
        deepEqual(getHTMLContext(html, 276), undefined);

        // Inside tag but in `style` attribute value: syntax is `css` but no context
        // since caret is inside property name
        deepEqual(getHTMLContext(html, 286), {
            syntax: 'css',
            inline: true
        });

        // Same as above but caret is inside CSS property value
        deepEqual(getHTMLContext(html, 290), {
            syntax: 'css',
            inline: true,
            context: context('padding')
        });
        deepEqual(getHTMLContext(html, 292), {
            syntax: 'css',
            inline: true,
            context: context('padding')
        });

        // Inside empty `style` attribute
        deepEqual(getHTMLContext(html, 351), {
            syntax: 'css',
            inline: true
        });
    });

    it('CSS in HTML', () => {
        const html = read('./samples/embedded-style.html');

        // Inside <style> tag, inside selector block
        deepEqual(getHTMLContext(html, 212), {
            syntax: 'css',
            context: context('')
        });

        // Outside selector block
        deepEqual(getHTMLContext(html, 194), undefined);

        // Inside property value
        deepEqual(getHTMLContext(html, 224), {
            syntax: 'css',
            context: context('padding')
        });
    });

    it('CSS context', () => {
        const scss = read('./samples/style.scss');

        // Not inside selector block
        deepEqual(getCSSContext(scss, 9), undefined);

        // ...but inside property (variable)
        deepEqual(getCSSContext(scss, 5), { name: '$foo' });

        // Inside selector
        deepEqual(getCSSContext(scss, 12), undefined);

        // Inside selector block
        deepEqual(getCSSContext(scss, 36), { name: '' });

        // Inside property value
        deepEqual(getCSSContext(scss, 32), { name: 'padding' });

        // Still inside selector block
        deepEqual(getCSSContext(scss, 125), { name: '' });

        // Not inside selector
        deepEqual(getCSSContext(scss, 128), undefined);
    });
});
