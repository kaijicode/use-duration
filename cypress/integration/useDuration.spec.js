import React from 'react';
import ReactDOM from "react-dom";

import { DurationInput } from "../components/DurationInput";
import { DurationContentEditable } from "../components/DurationContentEditable";
import { STATUS } from "../../src/useDuration";


const BASE_URL = 'http://localhost:1234/';

export const render = (node, rootId = '#root') => {
    cy.get(rootId).then((element) => {
        const root = element[0];
        ReactDOM.render(node, root);
    })
}

const setup = () => {
    cy.visit(BASE_URL);

    // Issue with cypress clock():
    // https://github.com/cypress-io/cypress/issues/7577#issuecomment-776767915
    cy.clock(new Date(2021, 0, 1, 0, 0, 0, 0)).then(clock => clock.bind(window))
}

// actions
const clicker = (testId) => () => cy.get(testId).click();

const controller = {
    start: clicker('[data-test-id="btn-start"]'),
    stop: clicker('[data-test-id="btn-stop"]'),
    resume: clicker('[data-test-id="btn-resume"]'),
    pause: clicker('[data-test-id="btn-pause"]'),
    tick: (milliseconds) => cy.tick(milliseconds),
    change: (value) => cy.get('[data-test-id="duration"]')
        .focus()
        .type('{selectAll}')
        .type(value)
        .blur(),

    is: (value) => cy.get('[data-test-id="duration"]').should('have.value', value)
}

// adjustments when working with contentEditable elements
const contentEditableController = {
    ...controller,
    is: (value) => {
        cy.get('[data-test-id="duration"]').should('have.text', value);
    },
    change: (value) => {
        value.split('').forEach((char, index) => {
            cy.get(`[data-test-id="${index}"]`).then(jQueryElement => {
                const domElement = jQueryElement[0];
                domElement.innerText = char;
            })
        })
    }
}

const COMPONENTS = [
    // duration that uses an <input>
    {component: DurationInput, controller: controller},

    // duration that uses contentEditable element (e.g a <div contentEditable>)
    {component: DurationContentEditable, controller: contentEditableController}
]

describe('Duration', () => {
    beforeEach(setup);

    // generate tests dynamically for both of the components
    COMPONENTS.forEach(({component: Component, controller}) => {
        it(`${Component.name}: should expect initial state of 00:00:00`, () => {
            render(<Component/>);
            controller.is('00:00:00');
        });

        it(`${Component.name}: should be stopped initially`, () => {
            render(<Component/>);

            controller.is('00:00:00');

            controller.tick(3000);
            controller.is('00:00:00');
        });

        it(`${Component.name}: should start`, () => {
            render(<Component/>);

            controller.start();

            controller.tick(5000);
            controller.is('00:00:05');
        });

        it(`${Component.name}: should stop`, () => {
            render(<Component/>);
            controller.start();

            controller.tick(5000);
            controller.is('00:00:05');

            controller.stop();
            controller.is('00:00:00');

            controller.tick(1000);
            controller.is('00:00:00');
        });

        it(`${Component.name}: should pause`, () => {
            render(<Component/>);
            controller.start();

            controller.tick(5000);
            controller.is('00:00:05');
            controller.pause();

            controller.tick(1000);
            controller.is('00:00:05');
        });

        it(`${Component.name}: should resume duration after pause`, () => {
            render(<Component/>);
            controller.start();

            controller.tick(5000);
            controller.pause();

            controller.tick(2000);

            controller.resume();
            controller.tick(1000);

            controller.is('00:00:06');
        });

        it(`${Component.name}: should expect to lose precision when resumed after pause if not using milliseconds`, () => {
            render(<Component/>);
            controller.start();

            // 5s 500ms
            controller.tick(5500);
            controller.pause();

            controller.tick(1000);

            // add 800ms
            controller.resume();
            controller.tick(800);

            // expect precision loss (total milliseconds left until completing a second -- is unknown)
            controller.is('00:00:05');
        })

        it(`${Component.name}: should not lose precision when resumed after pause when using milliseconds`, () => {
            render(<Component format={'{hours}:{minutes}:{seconds}.{milliseconds}'} updateInterval={10}/>);
            controller.start();

            controller.tick(5500);
            controller.pause();

            controller.tick(1000);

            controller.resume();
            controller.tick(200);

            controller.is('00:00:05.70'); // 5500s + 200ms = 5700s (700 / 10 = 70).
        })

        it(`${Component.name}: should be able to pause - edit - resume`, () => {
            render(<Component/>);

            controller.start();
            controller.tick(5000);
            controller.is('00:00:05');
            controller.pause();

            controller.change('00:00:02');
            controller.resume();
            controller.tick(2000);

            controller.is('00:00:04');
        });

        it(`${Component.name}: should be able to pause and resume without editing`, () => {
            render(<Component/>);

            controller.start();
            controller.tick(5000);
            controller.is('00:00:05');
            controller.pause();

            cy.get('[data-test-id="duration"]').focus().blur();
            controller.resume();
            controller.tick(2000);

            controller.is('00:00:07');
        });

        it(`${Component.name}: should initially start duration when start and status=running`, () => {
            const start = new Date();
            render(<Component start={start} status={STATUS.RUNNING}/>);

            controller.is('00:00:00');
            controller.tick(10000);

            controller.is('00:00:10');
        });

        it(`${Component.name}: should not start duration when only start prop is passed`, () => {
            const start = new Date();
            render(<Component start={start}/>);

            controller.is('00:00:00');
            controller.tick(10000);

            controller.is('00:00:00');
        });

        it(`${Component.name}: status=stopped - edit - resume`, () => {
            const start = new Date();
            render(<Component start={start} status={STATUS.STOPPED}/>);

            controller.is('00:00:00');
            controller.change('00:00:10');

            controller.resume();
            controller.tick(5000);

            controller.is('00:00:15');
        });

        // TODO: Fix change is not registered
        //   after calling controller.change()
        //   Investigate how it is possible to change an element which is contentEditable
        //   https://github.com/cypress-io/cypress/issues/2839
        it.skip(`${Component.name}: status=stopped - edit - start`, () => {
            console.log(`${Component.name}`)
            const start = new Date();
            render(<Component start={start} status={STATUS.STOPPED}/>);

            controller.is('00:00:00');
            controller.change('00:00:10');

            controller.start();
            controller.tick(5000);

            controller.is('00:00:05');
        });

        it(`${Component.name}: status=stopped - edit - start - stop`, () => {
            render(<Component start={null} status={STATUS.STOPPED}/>);

            controller.is('00:00:00');
            controller.change('00:00:05');

            controller.start();
            controller.tick(10000);

            controller.is('00:00:10');
            controller.stop();

            controller.is('00:00:00');
        });
    });
});
