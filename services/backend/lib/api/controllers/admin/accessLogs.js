// import dotProp        from 'dot-prop';
// import json2csv       from  'json2csv';
import chista from '../../chista';

import List   from '../../../services/admin/accessLogs/List';

export default {
    list : chista.makeServiceRunner(List, req => ({ ...req.query })) /* ,
    async listCSV(req, res, next) {
        try {
            const promise = chista.runService(List, {
                context : {
                    ...dotProp.get(req, 'session.context', {}),
                    noLimits : true
                },
                params : { ...req.query }
            });
            const { data } = await promise;

            const fields = [
                {
                    label : 'Subject Name',
                    value : 'SubjectName'
                }, {
                    label : 'Token Name',
                    value : 'TokenName'
                }, {
                    label : 'Reader Name',
                    value : 'ReaderName'
                }, {
                    label : 'Status',
                    value : 'Status'
                }, {
                    label : 'Time',
                    value : 'Time'
                }
            ];


            res.attachment(`access-logs.${new Date() / 1}.csv`);

            const result = new json2csv.Parser({
                fields,
                excelStrings : true,
                delimiter    : ';'
            }).parse(data.map((log) => {
                return {
                    SubjectName : log.accessSubject && log.accessSubject.name,
                    TokenName   : log.accessSubjectToken && log.accessSubjectToken.name,
                    ReaderName  : log.accessTokenReader && log.accessTokenReader.name,
                    Status      : log.status,
                    Time        : log.attemptedAt.toString()
                };
            }));

            res.status(200).send(result);
        } catch (e) {
            console.log(e);

            return next(e);
        }
    }*/
};
