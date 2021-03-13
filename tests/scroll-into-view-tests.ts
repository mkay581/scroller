import sinon, { SinonStub } from 'sinon';
import { scrollIntoView, utils } from '../src/scroll';
import createStub from 'raf-stub';

import { expect, assert } from '@esm-bundle/chai';

let mockRaf: any;

describe('scrollIntoView', function () {
    let dateNowStub: SinonStub;
    let currentTime;
    let requestAnimationFrameStub: SinonStub;
    let getDocumentStub: SinonStub;

    beforeEach(function () {
        mockRaf = createStub();
        requestAnimationFrameStub = sinon
            .stub(window, 'requestAnimationFrame')
            .callsFake(mockRaf.add);
        dateNowStub = sinon.stub(Date, 'now');
        currentTime = 1422630923001;
        dateNowStub.onFirstCall().returns(currentTime); // set the current time for first animation frame
        currentTime += 5;
        dateNowStub.onSecondCall().returns(currentTime); // set the current animation time enough time forward to simulate a time that will trigger the last frame
        currentTime += 1000;
        dateNowStub.onThirdCall().returns(currentTime); // set the current animation time enough time forward to simulate a time that will trigger the last frame
        getDocumentStub = sinon.stub(utils, 'getDocument').returns(({
            body: document.createElement('div'),
            documentElement: document.createElement('div'),
        } as unknown) as HTMLDocument);
    });

    afterEach(function () {
        requestAnimationFrameStub.restore();
        dateNowStub.restore();
        getDocumentStub.restore();
    });

    [true, false, {}].forEach((testValue) => {
        it(`should throw an error when attempting to pass ${typeof testValue} to scrollIntoView()`, function () {
            assert.throws(() => {
                // @ts-ignore
                scrollIntoView(testValue);
            }, `The element passed to scrollIntoView() must be a valid element. You passed ${testValue}.`);
        });
    });

    it('should throw an error when nothing is passed to scrollIntoView()', function () {
        assert.throws(() => {
            // @ts-ignore
            scrollIntoView();
        }, `The element passed to scrollIntoView() was undefined.`);
    });

    it('should NOT throw an error when initializing with a value that is a DOM element', function () {
        assert.doesNotThrow(() => {
            scrollIntoView(document.createElement('div'));
        });
    });

    it('passing an element scrollIntoView() with a custom container should move the element the amount of distance from the top of its container', function (done) {
        let outerEl = document.createElement('div');
        // must set up outer element to not have any offsetTop
        // value by placing it at the top/left-most area in viewport
        outerEl.style.position = 'absolute';
        outerEl.style.left = '0';
        outerEl.style.top = '0';
        let innerEl = document.createElement('div');
        let secondInnerEl = document.createElement('div');
        outerEl.appendChild(innerEl);
        outerEl.appendChild(secondInnerEl);
        document.body.appendChild(outerEl);
        // setup to be "scrollable"
        outerEl.style.overflow = 'hidden';
        outerEl.style.height = '150px';
        // inner element
        let innerElHeight = 120;
        innerEl.style.height = `${innerElHeight}px`;
        // second element should be underneath
        secondInnerEl.style.height = '600px';
        // setup current scroll position
        outerEl.scrollTop = 0;
        scrollIntoView(secondInnerEl, outerEl);
        mockRaf.step(3);
        setTimeout(function () {
            assert.equal(outerEl.scrollTop, innerElHeight);
            document.body.removeChild(outerEl);
            done();
        }, 0);
    });

    it('passing an element scrollIntoView() with no container element should move the element from the top of document.body el', function (done) {
        let bodyEl = document.createElement('div');
        // must set up outer element to not have any offsetTop
        // value by placing it at the top/left-most area in viewport
        bodyEl.style.position = 'absolute';
        bodyEl.style.left = '0';
        bodyEl.style.top = '0';
        let innerEl = document.createElement('div');
        let secondInnerEl = document.createElement('div');
        bodyEl.appendChild(innerEl);
        bodyEl.appendChild(secondInnerEl);
        document.body.appendChild(bodyEl);
        // setup to be "scrollable"
        bodyEl.style.overflow = 'hidden';
        bodyEl.style.height = '150px';
        // inner element
        let innerElHeight = 120;
        innerEl.style.height = `${innerElHeight}px`;
        // second element should be underneath
        secondInnerEl.style.height = '600px';
        // setup current scroll position
        bodyEl.scrollTop = 0;
        getDocumentStub.returns(({
            body: bodyEl,
            documentElement: bodyEl,
        } as unknown) as HTMLDocument);
        scrollIntoView(secondInnerEl);
        mockRaf.step(3);
        setTimeout(function () {
            assert.equal(bodyEl.scrollTop, innerElHeight);
            document.body.removeChild(bodyEl);
            done();
        }, 0);
    });

    it('passing a deeply nested element that is out of viewport to scrollIntoView() should move the element the proper amount of distance from the top of document.body el', function (done) {
        let bodyEl = document.createElement('div');
        let firstInnerElHeight = 73;
        bodyEl.style.position = 'absolute';
        bodyEl.style.top = '0';
        bodyEl.style.left = '0';
        bodyEl.style.height = `${firstInnerElHeight}px`;
        bodyEl.style.overflow = 'hidden';
        let containerEl = document.createElement('div');
        bodyEl.appendChild(containerEl);
        // padded inner el
        let firstInnerEl = document.createElement('div');
        firstInnerEl.style.width = '100%';
        firstInnerEl.style.height = firstInnerElHeight + 'px';
        containerEl.appendChild(firstInnerEl);
        // inner element
        let innerEl = document.createElement('div');
        innerEl.style.width = '100%';
        innerEl.style.height = '200px';
        containerEl.appendChild(innerEl);
        document.body.appendChild(bodyEl);
        getDocumentStub.returns(({
            body: bodyEl,
            documentElement: bodyEl,
        } as unknown) as HTMLDocument);
        assert.equal(innerEl.getBoundingClientRect().top, firstInnerElHeight); // make sure element is in right position
        scrollIntoView(innerEl);
        mockRaf.step(3);
        setTimeout(function () {
            assert.equal(bodyEl.scrollTop, firstInnerElHeight);
            bodyEl.removeChild(containerEl);
            done();
        }, 0);
    });

    it('passing an element to scrollIntoView() with a duration of 0 should scroll to that element immediately', function (done) {
        let outerEl = document.createElement('div');
        // must set up outer element to not have any offsetTop
        // value by placing it at the top/left-most area in viewport
        outerEl.style.position = 'absolute';
        outerEl.style.left = '0';
        outerEl.style.top = '0';
        let innerEl = document.createElement('div');
        let secondInnerEl = document.createElement('div');
        outerEl.appendChild(innerEl);
        outerEl.appendChild(secondInnerEl);
        document.body.appendChild(outerEl);
        // setup to be "scrollable"
        outerEl.style.overflow = 'hidden';
        outerEl.style.height = '150px';
        // inner element
        let innerElHeight = 120;
        innerEl.style.height = `${innerElHeight}px`;
        // second element should be underneath
        secondInnerEl.style.height = '600px';
        // setup current scroll position
        outerEl.scrollTop = 0;
        scrollIntoView(secondInnerEl, outerEl, { behavior: 'smooth' });
        mockRaf.step(3);
        setTimeout(function () {
            assert.equal(outerEl.scrollTop, innerElHeight);
            document.body.removeChild(outerEl);
            done();
        }, 0);
    });

    it('passing an element to scrollIntoView() with an extra long duration should scroll to that element within the duration', function () {
        let time = new Date().getTime();
        let bodyEl = document.createElement('div');
        // must set up outer element to not have any offsetTop
        // value by placing it at the top/left-most area in viewport
        bodyEl.style.position = 'absolute';
        bodyEl.style.left = '0';
        bodyEl.style.top = '0';
        let innerEl = document.createElement('div');
        let secondInnerEl = document.createElement('div');
        bodyEl.appendChild(innerEl);
        bodyEl.appendChild(secondInnerEl);
        document.body.appendChild(bodyEl);
        // setup to be "scrollable"
        bodyEl.style.overflow = 'hidden';
        bodyEl.style.height = '150px';
        // inner element
        let innerElHeight = 120;
        innerEl.style.height = `${innerElHeight}px`;
        // second element should be underneath
        secondInnerEl.style.height = '600px';
        // setup current scroll position
        bodyEl.scrollTop = 0;
        getDocumentStub.returns(({
            body: bodyEl,
            documentElement: bodyEl,
        } as unknown) as HTMLDocument);
        dateNowStub.reset();
        dateNowStub.returns(time);
        scrollIntoView(secondInnerEl, {
            duration: 10000,
        } as ScrollIntoViewOptions);
        dateNowStub.returns((time += 5000));
        requestAnimationFrameStub.yield();
        expect(bodyEl.scrollTop).to.not.equal(innerElHeight);
        dateNowStub.returns((time += 4999));
        requestAnimationFrameStub.yield();
        expect(bodyEl.scrollTop).to.not.equal(innerElHeight);
        dateNowStub.returns((time += 1));
        requestAnimationFrameStub.yield();
        expect(bodyEl.scrollTop).to.equal(innerElHeight);
        document.body.removeChild(bodyEl);
    });
});
