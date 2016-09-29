load("//tools:userjs.bzl", "userscript_binary")

BASE_URL = 'https://iitc.me/stable/'


def iitc_plugin(name, base, id, title, version, description):
  # TODO: set date/time properly
  when = '2016-09-29-220000'

  date, time = when.rsplit('-', 1)
  version += '.%s.%s' % (date.replace('-', ''), time)

  userscript_binary(
      name=name,
      deps=[base],
      id=id,
      script_name=title,
      version=version,
      namespace='https://iitc.me',
      update_url='%s/%s.meta.js' % (BASE_URL.rstrip('/'), name),
      download_url='%s/%s.user.js' % (BASE_URL.rstrip('/'), name),
      description='[iitc-%s] %s' % (when, description),
      include=[
          'https://www.ingress.com/intel*',
          'http://www.ingress.com/intel*',
          'https://www.ingress.com/mission/*',
          'http://www.ingress.com/mission/*',
      ],
      match=[
          'https://www.ingress.com/intel*',
          'http://www.ingress.com/intel*',
          'https://www.ingress.com/mission*',
          'http://www.ingress.com/mission*',
          'https://www.ingress.com/mission/*',
          'http://www.ingress.com/mission/*',
      ],
      grant=['none'],
  )
