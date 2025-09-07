-- PostgreSQL initialization script for Video Creation Platform

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE video_creation'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'video_creation');

-- Connect to the video_creation database
\c video_creation;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    subscription_tier VARCHAR(20) DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    default_video_quality VARCHAR(10) DEFAULT '1080p',
    default_aspect_ratio VARCHAR(10) DEFAULT '16:9',
    auto_publish BOOLEAN DEFAULT false,
    notification_email BOOLEAN DEFAULT true,
    notification_push BOOLEAN DEFAULT true,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    theme VARCHAR(20) DEFAULT 'light',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create series table
CREATE TABLE IF NOT EXISTS series (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    frequency VARCHAR(20) DEFAULT 'weekly',
    platforms TEXT[], -- Array of platform names
    is_active BOOLEAN DEFAULT true,
    next_scheduled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create api_configurations table
CREATE TABLE IF NOT EXISTS api_configurations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR(50) NOT NULL,
    api_key VARCHAR(500) NOT NULL,
    additional_config JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, service_name)
);

-- Create video_templates table
CREATE TABLE IF NOT EXISTS video_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    aspect_ratio VARCHAR(10) DEFAULT '16:9',
    duration_range VARCHAR(20),
    template_data JSONB NOT NULL,
    preview_url VARCHAR(500),
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create scheduled_posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    video_id VARCHAR(255) NOT NULL,
    platforms TEXT[] NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    published_urls JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create publishing_calendars table
CREATE TABLE IF NOT EXISTS publishing_calendars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    series_id INTEGER REFERENCES series(id) ON DELETE CASCADE,
    frequency VARCHAR(20) NOT NULL,
    time_slots JSONB NOT NULL,
    platforms TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT true,
    next_scheduled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table for tracking user actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_tier, subscription_expires_at);
CREATE INDEX IF NOT EXISTS idx_series_user_id ON series(user_id);
CREATE INDEX IF NOT EXISTS idx_series_active ON series(is_active);
CREATE INDEX IF NOT EXISTS idx_api_configs_user_service ON api_configurations(user_id, service_name);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_publishing_calendars_user_id ON publishing_calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_publishing_calendars_active ON publishing_calendars(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create triggers for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_series_updated_at BEFORE UPDATE ON series
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_configurations_updated_at BEFORE UPDATE ON api_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_templates_updated_at BEFORE UPDATE ON video_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_posts_updated_at BEFORE UPDATE ON scheduled_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_publishing_calendars_updated_at BEFORE UPDATE ON publishing_calendars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default video templates
INSERT INTO video_templates (name, description, category, aspect_ratio, duration_range, template_data, preview_url, is_premium) VALUES
('Modern Explainer', 'Clean and modern template for explainer videos', 'explainer', '16:9', '60-180', '{"style": "modern", "colors": ["#3B82F6", "#1E40AF"], "fonts": ["Inter", "Roboto"]}', 'https://example.com/preview1.jpg', false),
('Social Media Story', 'Vertical template optimized for social media stories', 'social', '9:16', '15-60', '{"style": "social", "colors": ["#F59E0B", "#D97706"], "fonts": ["Poppins", "Open Sans"]}', 'https://example.com/preview2.jpg', false),
('Corporate Presentation', 'Professional template for business presentations', 'business', '16:9', '120-300', '{"style": "corporate", "colors": ["#1F2937", "#374151"], "fonts": ["Source Sans Pro", "Lato"]}', 'https://example.com/preview3.jpg', true),
('Creative Showcase', 'Artistic template for creative content', 'creative', '16:9', '30-120', '{"style": "creative", "colors": ["#8B5CF6", "#7C3AED"], "fonts": ["Montserrat", "Playfair Display"]}', 'https://example.com/preview4.jpg', true),
('News & Updates', 'Template for news and update videos', 'news', '16:9', '60-180', '{"style": "news", "colors": ["#EF4444", "#DC2626"], "fonts": ["Roboto", "Source Sans Pro"]}', 'https://example.com/preview5.jpg', false);

-- Create a function to clean up old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create a function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_id_param INTEGER)
RETURNS TABLE(
    total_videos INTEGER,
    total_series INTEGER,
    active_series INTEGER,
    scheduled_posts INTEGER,
    published_posts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        0 as total_videos, -- This would come from MongoDB
        (SELECT COUNT(*)::INTEGER FROM series WHERE user_id = user_id_param),
        (SELECT COUNT(*)::INTEGER FROM series WHERE user_id = user_id_param AND is_active = true),
        (SELECT COUNT(*)::INTEGER FROM scheduled_posts WHERE user_id = user_id_param AND status = 'pending'),
        (SELECT COUNT(*)::INTEGER FROM scheduled_posts WHERE user_id = user_id_param AND status = 'published');
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;

