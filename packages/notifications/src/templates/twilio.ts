type Template = {
    [language: string]: {
        [action: string]: { sid: string }
    }
};

const templates: Template = {
    'es': {
        'next_round': {
            sid: 'HXa6a275bbbfa4e3fbb00898722d56004a',
        }
    }
};

export const getTemplate = (language: string, action: string): string | undefined => {
    return templates?.[language]?.[action]?.sid ?? undefined;
};