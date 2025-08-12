-- 湖仓建模工具数据库初始化脚本

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 用户表
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(128),
    role VARCHAR(32) NOT NULL DEFAULT 'USER',
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 数据源连接表
CREATE TABLE data_source_connections (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    type VARCHAR(32) NOT NULL, -- mysql, postgresql, hive, clickhouse
    host VARCHAR(128) NOT NULL,
    port INTEGER NOT NULL,
    database_name VARCHAR(128),
    schema_name VARCHAR(128),
    username VARCHAR(128),
    password_encrypted VARCHAR(255),
    connection_params JSONB,
    status VARCHAR(16) NOT NULL DEFAULT 'INACTIVE',
    last_sync_time TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 数据源表信息
CREATE TABLE data_source_tables (
    id BIGSERIAL PRIMARY KEY,
    connection_id BIGINT NOT NULL REFERENCES data_source_connections(id) ON DELETE CASCADE,
    table_name VARCHAR(128) NOT NULL,
    table_type VARCHAR(32), -- table, view
    table_comment TEXT,
    row_count BIGINT,
    size_bytes BIGINT,
    last_sync_time TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(connection_id, table_name)
);

-- 数据源字段信息
CREATE TABLE data_source_fields (
    id BIGSERIAL PRIMARY KEY,
    table_id BIGINT NOT NULL REFERENCES data_source_tables(id) ON DELETE CASCADE,
    field_name VARCHAR(128) NOT NULL,
    field_type VARCHAR(128),
    field_length INTEGER,
    field_precision INTEGER,
    field_scale INTEGER,
    is_nullable BOOLEAN DEFAULT TRUE,
    is_primary_key BOOLEAN DEFAULT FALSE,
    is_unique BOOLEAN DEFAULT FALSE,
    default_value TEXT,
    field_comment TEXT,
    position INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(table_id, field_name)
);

-- 主题域配置表
CREATE TABLE domain_configs (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7), -- hex color code
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 分层配置表
CREATE TABLE layer_configs (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(32) NOT NULL UNIQUE, -- ODS, DWD, DIM, DWS, ADS
    display_name VARCHAR(64) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 数据模型表
CREATE TABLE data_models (
    id BIGSERIAL PRIMARY KEY,
    table_name_en VARCHAR(128) NOT NULL UNIQUE,
    table_name_zh VARCHAR(128),
    overview TEXT,
    layer VARCHAR(32) NOT NULL REFERENCES layer_configs(name),
    domains TEXT[], -- 主题域数组
    status VARCHAR(16) NOT NULL DEFAULT 'DRAFT', -- draft, published, archived
    version INTEGER NOT NULL DEFAULT 1,
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 模型字段表
CREATE TABLE model_fields (
    id BIGSERIAL PRIMARY KEY,
    model_id BIGINT NOT NULL REFERENCES data_models(id) ON DELETE CASCADE,
    field_name_en VARCHAR(128) NOT NULL,
    field_name_zh VARCHAR(128),
    is_configured BOOLEAN DEFAULT FALSE,
    data_type VARCHAR(128),
    field_length INTEGER,
    field_precision INTEGER,
    field_scale INTEGER,
    is_nullable BOOLEAN DEFAULT TRUE,
    is_primary_key BOOLEAN DEFAULT FALSE,
    default_value TEXT,
    field_description TEXT,
    source_system VARCHAR(128),
    source_connection_id BIGINT REFERENCES data_source_connections(id),
    source_database VARCHAR(128),
    source_schema VARCHAR(128),
    source_table VARCHAR(128),
    source_field VARCHAR(128),
    source_field_type VARCHAR(128),
    calc_rule TEXT, -- DWS/ADS层计算规则
    position INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(model_id, field_name_en)
);

-- 标准字段库表
CREATE TABLE standard_fields (
    id BIGSERIAL PRIMARY KEY,
    field_name_en VARCHAR(128) NOT NULL UNIQUE,
    field_name_zh VARCHAR(128),
    data_type VARCHAR(128) NOT NULL,
    field_length INTEGER,
    field_precision INTEGER,
    field_scale INTEGER,
    is_nullable BOOLEAN DEFAULT TRUE,
    default_value TEXT,
    field_description TEXT,
    business_domain VARCHAR(128),
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 字段评论表
CREATE TABLE field_comments (
    id BIGSERIAL PRIMARY KEY,
    field_id BIGINT NOT NULL REFERENCES model_fields(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 血缘关系表
CREATE TABLE lineage_relationships (
    id BIGSERIAL PRIMARY KEY,
    source_model_id BIGINT NOT NULL REFERENCES data_models(id),
    source_field_id BIGINT REFERENCES model_fields(id),
    target_model_id BIGINT NOT NULL REFERENCES data_models(id),
    target_field_id BIGINT REFERENCES model_fields(id),
    relationship_type VARCHAR(32) NOT NULL, -- table_to_table, field_to_field, field_to_table
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 列可见性配置表
CREATE TABLE column_visibility_configs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    page_type VARCHAR(32) NOT NULL, -- model_management, online_modeling
    column_key VARCHAR(64) NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, page_type, column_key)
);

-- 系统配置表
CREATE TABLE system_configs (
    id BIGSERIAL PRIMARY KEY,
    config_key VARCHAR(128) NOT NULL UNIQUE,
    config_value TEXT,
    config_type VARCHAR(32) NOT NULL, -- string, number, boolean, json
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 操作日志表
CREATE TABLE operation_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    operation_type VARCHAR(64) NOT NULL,
    operation_target VARCHAR(64) NOT NULL,
    target_id BIGINT,
    operation_details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_data_source_connections_type ON data_source_connections(type);
CREATE INDEX idx_data_source_connections_status ON data_source_connections(status);
CREATE INDEX idx_data_source_tables_connection_id ON data_source_tables(connection_id);
CREATE INDEX idx_data_source_fields_table_id ON data_source_fields(table_id);
CREATE INDEX idx_data_models_layer ON data_models(layer);
CREATE INDEX idx_data_models_status ON data_models(status);
CREATE INDEX idx_data_models_domains ON data_models USING GIN(domains);
CREATE INDEX idx_model_fields_model_id ON model_fields(model_id);
CREATE INDEX idx_model_fields_source_connection ON model_fields(source_connection_id);
CREATE INDEX idx_standard_fields_business_domain ON standard_fields(business_domain);
CREATE INDEX idx_lineage_relationships_source ON lineage_relationships(source_model_id);
CREATE INDEX idx_lineage_relationships_target ON lineage_relationships(target_model_id);
CREATE INDEX idx_operation_logs_user_id ON operation_logs(user_id);
CREATE INDEX idx_operation_logs_created_at ON operation_logs(created_at);

-- 插入默认分层配置
INSERT INTO layer_configs (name, display_name, description, sort_order) VALUES
('ODS', '原始数据层', '原始数据存储层，保持数据原貌不做任何处理', 1),
('DWD', '明细数据层', '明细数据层，对ODS层数据进行清洗转换后的明细数据', 2),
('DIM', '维度数据层', '维度数据层，存储各种维度信息', 3),
('DWS', '汇总数据层', '汇总数据层，对DWD层数据进行轻度汇总', 4),
('ADS', '应用数据层', '应用数据层，面向业务应用的汇总数据', 5);

-- 插入默认主题域配置
INSERT INTO domain_configs (name, description, color, sort_order) VALUES
('用户域', '用户相关的数据域，包含用户信息、用户行为等', '#1890FF', 1),
('订单域', '订单相关的数据域，包含订单信息、交易记录等', '#52C41A', 2),
('商品域', '商品相关的数据域，包含商品信息、库存信息等', '#FAAD14', 3),
('营销域', '营销相关的数据域，包含活动信息、推广效果等', '#F5222D', 4),
('财务域', '财务相关的数据域，包含收入支出、成本分析等', '#722ED1', 5);

-- 插入系统配置
INSERT INTO system_configs (config_key, config_value, config_type, description, is_system) VALUES
('system.name', '湖仓建模工具', 'string', '系统名称', true),
('system.version', '1.0.0', 'string', '系统版本', true),
('system.description', '一站式湖仓建模平台', 'string', '系统描述', true),
('security.password.min_length', '6', 'number', '密码最小长度', true),
('security.password.require_complexity', 'true', 'boolean', '密码复杂度要求', true);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要自动更新updated_at的表创建触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_source_connections_updated_at BEFORE UPDATE ON data_source_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_source_tables_updated_at BEFORE UPDATE ON data_source_tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_source_fields_updated_at BEFORE UPDATE ON data_source_fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_domain_configs_updated_at BEFORE UPDATE ON domain_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_layer_configs_updated_at BEFORE UPDATE ON layer_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_models_updated_at BEFORE UPDATE ON data_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_model_fields_updated_at BEFORE UPDATE ON model_fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_standard_fields_updated_at BEFORE UPDATE ON standard_fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_column_visibility_configs_updated_at BEFORE UPDATE ON column_visibility_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_configs_updated_at BEFORE UPDATE ON system_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

