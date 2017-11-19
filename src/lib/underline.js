import * as Html from './html/index'
import * as htmlPaths from './styles/html-paths'

export default name => html => Html.elementWithTag(htmlPaths.element(name), [html])
