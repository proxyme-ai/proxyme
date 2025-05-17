import logging
import json
import datetime
import sqlite3
from typing import Dict, Any, Optional
from flask import current_app
import threading

# Thread-local storage for database connections
thread_local = threading.local()

class AuditLogger:
    def __init__(self, db_file="audit.db"):
        self.db_file = db_file
        self._init_db()
        
    def _get_db(self):
        if not hasattr(thread_local, 'conn'):
            thread_local.conn = sqlite3.connect(self.db_file)
        return thread_local.conn
        
    def _init_db(self):
        try:
            conn = self._get_db()
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    action TEXT NOT NULL,
                    status TEXT NOT NULL,
                    user_id TEXT,
                    agent_id TEXT,
                    details TEXT,
                    ip_address TEXT,
                    token_id TEXT
                )
            """)
            conn.commit()
        except Exception as e:
            logging.error(f"Error initializing audit database: {str(e)}")
            raise

    def log_event(self, 
                  event_type: str,
                  action: str,
                  status: str,
                  user_id: Optional[str] = None,
                  agent_id: Optional[str] = None,
                  details: Optional[Dict[str, Any]] = None,
                  ip_address: Optional[str] = None,
                  token_id: Optional[str] = None):
        """
        Log an audit event with structured data
        """
        try:
            timestamp = datetime.datetime.utcnow().isoformat()
            if isinstance(details, dict):
                details = json.dumps(details)
            
            conn = self._get_db()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO audit_logs 
                (timestamp, event_type, action, status, user_id, agent_id, details, ip_address, token_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (timestamp, event_type, action, status, user_id, agent_id, details, ip_address, token_id))
            conn.commit()
        except Exception as e:
            logging.error(f"Error logging audit event: {str(e)}")
            raise

    def get_events(self, 
                  event_type: Optional[str] = None,
                  user_id: Optional[str] = None,
                  agent_id: Optional[str] = None,
                  status: Optional[str] = None,
                  limit: int = 100):
        """
        Retrieve audit events with optional filtering
        """
        try:
            conn = self._get_db()
            cursor = conn.cursor()
            
            query = "SELECT * FROM audit_logs WHERE 1=1"
            params = []
            
            if event_type:
                query += " AND event_type = ?"
                params.append(event_type)
            if user_id:
                query += " AND user_id = ?"
                params.append(user_id)
            if agent_id:
                query += " AND agent_id = ?"
                params.append(agent_id)
            if status:
                query += " AND status = ?"
                params.append(status)
                
            query += " ORDER BY timestamp DESC LIMIT ?"
            params.append(limit)
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            # Convert rows to list of dictionaries
            events = []
            for row in rows:
                event = {
                    "id": row[0],
                    "timestamp": row[1],
                    "event_type": row[2],
                    "action": row[3],
                    "status": row[4],
                    "user_id": row[5],
                    "agent_id": row[6],
                    "details": json.loads(row[7]) if row[7] else None,
                    "ip_address": row[8],
                    "token_id": row[9]
                }
                events.append(event)
                
            return events
        except Exception as e:
            logging.error(f"Error retrieving audit events: {str(e)}")
            raise

# Create a singleton instance
audit_logger = AuditLogger() 