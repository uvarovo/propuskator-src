import AccessSubject from '../../../../models/AccessSubject';

export default async function ({ workspaceId, phone, accessSubject = null })  {
    if (!phone) return true;
    if (accessSubject && accessSubject.phone === phone) return true; // if update to the same number

    const sbj = await AccessSubject.findOne({
        where : {
            workspaceId,
            phone
        }
    });

    return !sbj;
}
