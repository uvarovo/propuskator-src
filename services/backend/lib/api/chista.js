import Chista from 'chista';
import { makeServiceRunner } from './serviceRunner';

const chista = new Chista({
    defaultLogger : () => {}
});

chista.makeServiceRunner = makeServiceRunner;

export default chista;
