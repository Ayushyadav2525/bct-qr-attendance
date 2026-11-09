from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.models import db
from config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)
    db.init_app(app)

    # Register API blueprints
    from app.routes.auth import auth_bp
    from app.routes.admin import admin_bp
    from app.routes.teacher import teacher_bp
    from app.routes.student import student_bp
    from app.routes.blockchain import blockchain_bp
    from app.routes.reports import reports_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(teacher_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(blockchain_bp)
    app.register_blueprint(reports_bp)

    @app.route('/api/health')
    def health():
        return jsonify({
            'status': 'healthy',
            'service': 'Blockchain QR Attendance REST API',
            'database': 'Connected'
        }), 200

    # Ensure tables and columns exist
    with app.app_context():
        db.create_all()
        try:
            from sqlalchemy import inspect, text
            inspector = inspect(db.engine)
            columns = [c['name'] for c in inspector.get_columns('attendance_sessions')]
            with db.engine.connect() as conn:
                if 'lecture_date' not in columns:
                    conn.execute(text("ALTER TABLE attendance_sessions ADD COLUMN lecture_date VARCHAR(50)"))
                if 'lecture_start_time' not in columns:
                    conn.execute(text("ALTER TABLE attendance_sessions ADD COLUMN lecture_start_time VARCHAR(20)"))
                if 'lecture_end_time' not in columns:
                    conn.execute(text("ALTER TABLE attendance_sessions ADD COLUMN lecture_end_time VARCHAR(20)"))
                conn.commit()
        except Exception as e:
            pass

    return app
