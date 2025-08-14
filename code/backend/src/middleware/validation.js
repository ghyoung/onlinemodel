import Joi from 'joi';

// 登录验证规则
const loginSchema = Joi.object({
  username: Joi.string().min(3).max(50).required().messages({
    'string.min': '用户名至少需要3个字符',
    'string.max': '用户名不能超过50个字符',
    'any.required': '用户名不能为空'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': '密码至少需要6个字符',
    'any.required': '密码不能为空'
  })
});

// 注册验证规则
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).pattern(/^[a-zA-Z0-9_]+$/).required().messages({
    'string.min': '用户名至少需要3个字符',
    'string.max': '用户名不能超过50个字符',
    'string.pattern.base': '用户名只能包含字母、数字和下划线',
    'any.required': '用户名不能为空'
  }),
  email: Joi.string().email().required().messages({
    'string.email': '请输入有效的邮箱地址',
    'any.required': '邮箱不能为空'
  }),
  password: Joi.string().min(6).max(100).required().messages({
    'string.min': '密码至少需要6个字符',
    'string.max': '密码不能超过100个字符',
    'any.required': '密码不能为空'
  }),
  role: Joi.string().valid('user', 'admin').default('user').messages({
    'any.only': '角色只能是user或admin'
  })
});

// 数据源验证规则
const dataSourceSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': '数据源名称至少需要2个字符',
    'string.max': '数据源名称不能超过100个字符',
    'any.required': '数据源名称不能为空'
  }),
  type: Joi.string().valid('mysql', 'postgresql', 'oracle', 'sqlserver', 'hive', 'clickhouse').required().messages({
    'any.only': '不支持的数据源类型',
    'any.required': '数据源类型不能为空'
  }),
  connection_info: Joi.object({
    host: Joi.string().required(),
    port: Joi.number().integer().min(1).max(65535).required(),
    database: Joi.string().required(),
    username: Joi.string().required(),
    password: Joi.string().required()
  }).required().messages({
    'any.required': '连接信息不能为空'
  })
});

// 模型验证规则
const modelSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': '模型名称至少需要2个字符',
    'string.max': '模型名称不能超过100个字符',
    'any.required': '模型名称不能为空'
  }),
  description: Joi.string().max(500).optional().messages({
    'string.max': '描述不能超过500个字符'
  }),
  model_type: Joi.string().valid('dimension', 'fact', 'summary', 'other').required().messages({
    'any.only': '模型类型只能是dimension、fact、summary或other',
    'any.required': '模型类型不能为空'
  })
});

// 字段验证规则
const fieldSchema = Joi.object({
  field_name: Joi.string().min(1).max(100).required().messages({
    'string.min': '字段名称至少需要1个字符',
    'string.max': '字段名称不能超过100个字符',
    'any.required': '字段名称不能为空'
  }),
  field_type: Joi.string().min(1).max(50).required().messages({
    'string.min': '字段类型至少需要1个字符',
    'string.max': '字段类型不能超过50个字符',
    'any.required': '字段类型不能为空'
  }),
  business_rule: Joi.string().max(500).optional().messages({
    'string.max': '业务规则不能超过500个字符'
  }),
  data_quality_rule: Joi.string().max(500).optional().messages({
    'string.max': '数据质量规则不能超过500个字符'
  })
});

// 验证中间件工厂函数
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: '数据验证失败',
        message: error.details[0].message
      });
    }
    
    // 将验证后的数据赋值给req.body
    req.body = value;
    next();
  };
}

// 导出验证中间件
export const validateLogin = validate(loginSchema);
export const validateRegister = validate(registerSchema);
export const validateDataSource = validate(dataSourceSchema);
export const validateModel = validate(modelSchema);
export const validateField = validate(fieldSchema);

// 通用验证中间件
export function validateId(req, res, next) {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      error: '参数错误',
      message: 'ID必须是正整数'
    });
  }
  req.params.id = id;
  next();
}

export function validatePagination(req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({
      error: '分页参数错误',
      message: '页码必须大于0，每页数量必须在1-100之间'
    });
  }
  
  req.query.page = page;
  req.query.query = limit;
  next();
}
