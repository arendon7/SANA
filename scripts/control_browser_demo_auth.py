from __future__ import annotations

from urllib.parse import quote, urlsplit

DEMO_IDENTITY_KEY = 'sana.demo.identity'


def authenticate_demo_admin(page, target_url: str) -> dict:
    """Authenticate through the real DEMO profile UI before exercising protected CONTROL routes.

    This deliberately does not seed localStorage directly and does not touch production/OIDC state.
    It follows the same local profile flow a human DEMO user uses, then verifies the resulting
    sandbox identity and production-disabled boundaries before returning to the caller.
    """
    parts = urlsplit(target_url)
    if parts.scheme not in {'http', 'https'} or not parts.netloc:
        raise AssertionError(f'INVALID_CONTROL_TARGET_URL:{target_url}')
    next_path = parts.path + (f'?{parts.query}' if parts.query else '')
    origin = f'{parts.scheme}://{parts.netloc}'
    auth_url = f'{origin}/demo-auth.html?next={quote(next_path, safe="")}'

    response = page.goto(auth_url, wait_until='networkidle')
    if response is None or response.status != 200:
        raise AssertionError(f'DEMO_AUTH_NOT_AVAILABLE:{response.status if response else None}')

    admin = page.locator('[data-demo-role="admin"]')
    if admin.count() != 1:
        raise AssertionError('DEMO_ADMIN_PROFILE_NOT_AVAILABLE')
    admin.click()
    page.wait_for_url(target_url)
    page.wait_for_load_state('networkidle')

    identity = page.evaluate(
        f"JSON.parse(localStorage.getItem('{DEMO_IDENTITY_KEY}')||'null')"
    )
    if not identity:
        raise AssertionError('DEMO_IDENTITY_NOT_PERSISTED')
    expected = {
        'environment': 'DEMO',
        'role': 'admin',
        'authProvider': 'LOCAL_DEMO_PROFILE',
        'productionExecutionAvailable': False,
        'productionActivationAllowed': False,
        'canonicalMutated': False,
    }
    for key, value in expected.items():
        if identity.get(key) != value:
            raise AssertionError(f'DEMO_IDENTITY_BOUNDARY_MISMATCH:{key}:{identity.get(key)!r}')
    return identity
