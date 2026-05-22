import os
from flask import Flask
from flask_cors import CORS


def create_app() -> Flask:
    app = Flask(__name__)

    # MVP: allow local dev frontend
    CORS(
        app,
        resources={r"/api/*": {"origins": os.environ.get("CORS_ORIGINS", "*")}},
    )

    # Register routes
    from engine.api.upload_resume import register_upload_resume_routes
    from engine.api.score_resume import register_score_resume_routes

    register_upload_resume_routes(app)
    register_score_resume_routes(app)

    @app.route("/")
    def index():
        return {
            "status": "online",
            "message": "Smart ATS Resume Analyzer API is running.",
            "endpoints": {
                "upload_resume": "/api/upload-resume (POST)",
                "score_resume": "/api/score-resume (POST)"
            }
        }

    return app


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5005"))
    create_app().run(host="0.0.0.0", port=port, debug=bool(os.environ.get("DEBUG", "")))


