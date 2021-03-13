import sinon, { SinonStub } from 'sinon';
import { scrollTo, utils, easingMap } from '../src/scroll';
import createStub from 'raf-stub';

import { expect, assert } from '@esm-bundle/chai';

let mockRaf: any;

describe('scroll', function () {
    let dateNowStub: SinonStub;
    let currentTime;
    let requestAnimationFrameStub: sinon.SinonStub;
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

    it('should throw an error when attempting to scroll anything that is not a DOM element', async function () {
        return Promise.all(
            [true, false, {}].map(async (testValue) => {
                // @ts-ignore
                return await scrollTo(testValue).catch((e) => {
                    assert.equal(
                        e.message,
                        `element passed to scrollTo() must be either the window or a DOM element, you passed ${testValue}!`
                    );
                });
            })
        );
    });

    it('should NOT throw an error when initializing with a value that is a DOM element', function () {
        assert.doesNotThrow(() => {
            scrollTo(document.createElement('div'));
        });
    });

    it("should update the window's scrollTop property when nothing is passed as the container", async function () {
        let innerEl = document.createElement('div');
        document.body.appendChild(innerEl);
        // inner element
        innerEl.style.height = '200vh';
        let testTo = 120;
        let scrollPromise = scrollTo(window, { top: testTo });
        mockRaf.step(3);
        await scrollPromise;
        assert.equal(window.scrollY, testTo);
        document.body.removeChild(innerEl);
    });

    it("should update the scrolled element's scrollTop property to the same coordinate specified in the second parameter supplied to scrollTo()", async function () {
        let outerEl = document.createElement('div');
        let innerEl = document.createElement('div');
        outerEl.appendChild(innerEl);
        document.body.appendChild(outerEl);
        // setup to be "scrollable"
        outerEl.style.overflow = 'hidden';
        outerEl.style.height = '150px';
        // inner element
        innerEl.style.height = '600px';
        // setup current scroll position
        outerEl.scrollTop = 100;
        let testTo = 120;
        let scrollPromise = scrollTo(outerEl, { top: testTo });
        mockRaf.step(3);
        await scrollPromise;
        assert.equal(outerEl.scrollTop, testTo);
        document.body.removeChild(outerEl);
    });

    it('scrollTo() should update document.documentElement (html element) scrollTop property if passed into scroll', function () {
        // setup element to be "scrollable"
        let bodyElement = document.createElement('div');
        bodyElement.scrollTop = 0;
        // setup documentElement to be "scrollable"
        let docEl = document.createElement('div');
        docEl.style.overflow = 'hidden';
        docEl.style.height = '150px';
        document.body.appendChild(docEl);
        let docInnerEl = document.createElement('div');
        docInnerEl.style.height = '600px';
        docEl.appendChild(docInnerEl);
        document.body.appendChild(docEl);
        let testTo = 120;
        let testDocumentElement = {
            documentElement: docEl,
            body: bodyElement,
        };
        getDocumentStub.returns(
            (testDocumentElement as unknown) as HTMLDocument
        );
        let scrollPromise = scrollTo(docEl, { top: testTo });
        mockRaf.step(3);
        return scrollPromise.then(function () {
            assert.equal(docEl.scrollTop, testTo);
            document.body.removeChild(docEl);
        });
    });

    it("should update its element's scrollTop to value supplied to scrollTo() immediately when duration 0 is used", function (done) {
        let outerEl = document.createElement('div');
        let innerEl = document.createElement('div');
        outerEl.appendChild(innerEl);
        document.body.appendChild(outerEl);
        // setup to be "scrollable"
        outerEl.style.overflow = 'hidden';
        outerEl.style.height = '150px';
        // inner element
        innerEl.style.height = '600px';
        // setup current scroll position
        outerEl.scrollTop = 100;
        let testTo = 120;
        scrollTo(outerEl, { top: testTo, duration: 0 });
        mockRaf.step(2);
        setTimeout(function () {
            assert.equal(outerEl.scrollTop, testTo);
            document.body.removeChild(outerEl);
            done();
        }, 0);
    });

    it("should update its element's scrollTop to value supplied to scrollTo() immediately when behavior is set to auto", function (done) {
        let outerEl = document.createElement('div');
        let innerEl = document.createElement('div');
        outerEl.appendChild(innerEl);
        document.body.appendChild(outerEl);
        // setup to be "scrollable"
        outerEl.style.overflow = 'hidden';
        outerEl.style.height = '150px';
        // inner element
        innerEl.style.height = '600px';
        // setup current scroll position
        outerEl.scrollTop = 100;
        let testTo = 120;
        scrollTo(outerEl, { top: testTo, behavior: 'auto' });
        mockRaf.step(2);
        setTimeout(function () {
            assert.equal(outerEl.scrollTop, testTo);
            document.body.removeChild(outerEl);
            done();
        }, 0);
    });

    it('should throw an error when attempting to scroll with an unsupported easing function', function () {
        const options = Object.keys(easingMap).join(',');
        const easing = 'invalidEasing' as any;
        let outerEl = document.createElement('div');
        return scrollTo(outerEl, { easing }).catch((e) => {
            assert.equal(
                e.message,
                `Scroll error: scroller does not support an easing option of "${easing}". Supported options are ${options}`
            );
        });
    });

    it('body should scroll back to top after having been scrolled', function (done) {
        let fakeBodyElement = document.createElement('div');
        fakeBodyElement.style.overflow = 'hidden';
        fakeBodyElement.style.height = '150px';
        let innerEl = document.createElement('div');
        innerEl.style.height = '600px';
        fakeBodyElement.appendChild(innerEl);
        document.body.appendChild(fakeBodyElement);
        const testTo = 120;
        getDocumentStub.returns(({
            body: fakeBodyElement,
            documentElement: document.createElement('div'),
        } as unknown) as HTMLDocument);
        scrollTo(fakeBodyElement, { top: testTo });
        mockRaf.step(3);
        setTimeout(function () {
            scrollTo(fakeBodyElement, { top: 0 });
            mockRaf.step(3);
            setTimeout(function () {
                expect(fakeBodyElement.scrollTop).to.equal(0);
                document.body.removeChild(fakeBodyElement);
                done();
            }, 0);
        }, 0);
    });
});
