import os
import runpy
import sqlite3
import unittest
from unittest import mock
from flask import Flask

# Utility function for patching sqlite3.connect to in-memory
_real_connect = sqlite3.connect
def memory_connect(*args, **kwargs):
    return _real_connect(':memory:')

class TestProxymeServiceMain(unittest.TestCase):
    def test_env_variables_used(self):
        env = {"PORT": "5055", "DEBUG": "1"}
        with mock.patch.dict(os.environ, env, clear=True), \
             mock.patch('sqlite3.connect', memory_connect), \
             mock.patch.object(Flask, 'run') as run_mock:
            runpy.run_module('packages.server.proxyme_service', run_name='__main__')
            run_mock.assert_called_once_with(host='0.0.0.0', port=5055, debug=True)

    def test_defaults_used(self):
        with mock.patch.dict(os.environ, {}, clear=True), \
             mock.patch('sqlite3.connect', memory_connect), \
             mock.patch.object(Flask, 'run') as run_mock:
            runpy.run_module('packages.server.proxyme_service', run_name='__main__')
            run_mock.assert_called_once_with(host='0.0.0.0', port=5001, debug=False)

if __name__ == '__main__':
    unittest.main()
