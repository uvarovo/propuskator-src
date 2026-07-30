import adminRouter from './adminRouter';
import mobileRouter from './mobileRouter';
import tokenReaderRouterv1 from './tokenReader/tokenReaderRouter.v1';
import tokenReaderRouterv2 from './tokenReader/tokenReaderRouter.v2';
import servicesRouter from './servicesRouter';

export default {
    adminRouter,
    mobileRouter,
    tokenReaderRouter : {
        v1 : tokenReaderRouterv1,
        v2 : tokenReaderRouterv2
    },
    servicesRouter
};
