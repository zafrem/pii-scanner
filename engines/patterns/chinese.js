"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chinesePatterns = void 0;
exports.chinesePatterns = {
    language: 'chinese',
    patterns: [
        {
            type: 'phone',
            pattern: '1[3-9]\\d{9}',
            flags: 'g',
            description: 'Chinese mobile phone numbers',
            examples: ['13812345678', '18987654321', '15611223344']
        },
        {
            type: 'phone',
            pattern: '0\\d{2,3}-?\\d{7,8}',
            flags: 'g',
            description: 'Chinese landline numbers',
            examples: ['010-12345678', '021-87654321', '075512345678']
        },
        {
            type: 'id_number',
            pattern: '\\d{17}[\\dxX]',
            flags: 'g',
            description: 'Chinese ID card numbers (18 digits)',
            examples: ['11010519491231002X', '440524188001010014']
        },
        {
            type: 'name',
            pattern: '[\\u4e00-\\u9fff]{2,4}(?=先生|女士|同志|老师|教授|经理|总监|主任)',
            flags: 'g',
            description: 'Chinese names with titles',
            examples: ['张三先生', '李四女士', '王五老师']
        },
        {
            type: 'name',
            pattern: '(?<=姓名[：:\\s]*)[\\u4e00-\\u9fff]{2,4}',
            flags: 'g',
            description: 'Chinese names after 姓名 label',
            examples: ['姓名：张三', '姓名 李四']
        },
        {
            type: 'address',
            pattern: '[\\u4e00-\\u9fff]+[省市区][\\u4e00-\\u9fff]*[市区县][\\u4e00-\\u9fff]*[街道路巷弄]\\d*号?',
            flags: 'g',
            description: 'Chinese addresses',
            examples: ['北京市朝阳区建国路88号', '上海市浦东新区陆家嘴环路1000号']
        },
        {
            type: 'postal_code',
            pattern: '\\d{6}',
            flags: 'g',
            description: 'Chinese postal codes',
            examples: ['100000', '200000', '518000']
        },
        {
            type: 'email',
            pattern: '[a-zA-Z0-9\\u4e00-\\u9fff._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
            flags: 'gi',
            description: 'Email addresses (including Chinese characters)',
            examples: ['张三@163.com', 'user@qq.com', '李四@company.com.cn']
        },
        {
            type: 'organization',
            pattern: '[\\u4e00-\\u9fff]+(?:公司|企业|集团|银行|学校|医院|政府|部门)',
            flags: 'g',
            description: 'Chinese organizations',
            examples: ['阿里巴巴集团', '中国银行', '清华大学']
        }
    ],
    contextRules: [
        {
            type: 'name',
            beforePatterns: ['姓名', '名字', '联系人', '负责人'],
            afterPatterns: ['先生', '女士', '同志', '老师'],
            negativePatterns: ['公司名', '企业名', '单位名'],
            weight: 0.8
        },
        {
            type: 'phone',
            beforePatterns: ['电话', '手机', '联系方式', '联系电话'],
            afterPatterns: [],
            negativePatterns: ['传真'],
            weight: 0.9
        },
        {
            type: 'id_number',
            beforePatterns: ['身份证', '身份证号', '证件号'],
            afterPatterns: [],
            negativePatterns: [],
            weight: 0.95
        }
    ]
};
//# sourceMappingURL=chinese.js.map